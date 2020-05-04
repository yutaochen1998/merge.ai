import tensorflow as tf
import numpy as np
import PIL.Image
import time
import sys

def tensor_to_image(tensor):
    tensor = tensor * 255
    tensor = np.array(tensor, dtype=np.uint8)
    if np.ndim(tensor) > 3:
        assert tensor.shape[0] == 1
        tensor = tensor[0]
    return PIL.Image.fromarray(tensor)


def load_img(path_to_img):
    max_dim = 2048
    img = tf.io.read_file(path_to_img)
    img = tf.image.decode_image(img, channels=3)
    img = tf.image.convert_image_dtype(img, tf.float32)

    #shape = tf.cast(tf.shape(img)[:-1], tf.float32)
    #long_dim = max(shape)
    #scale = max_dim / long_dim

    #new_shape = tf.cast(shape * scale, tf.int32)

    #img = tf.image.resize(img, new_shape)
    img = img[tf.newaxis, :]
    return img


def imshow(image, title=None):
    if len(image.shape) > 3:
        image = tf.squeeze(image, axis=0)

    plt.imshow(image)
    if title:
        plt.title(title)


def vgg_layers(layer_names):
    # Load VGG-16 with weights trained on imagenet
    vgg = tf.keras.applications.VGG16(include_top=False, weights='imagenet')
    outputs = [vgg.get_layer(name).output for name in layer_names]

    model = tf.keras.Model([vgg.input], outputs)
    return model


def gram_matrix(input_tensor):
    result = tf.linalg.einsum('bijc,bijd->bcd', input_tensor, input_tensor)
    input_shape = tf.shape(input_tensor)
    num_locations = tf.cast(input_shape[1] * input_shape[2], tf.float32)
    return result / num_locations


def clip_0_1(image):
    return tf.clip_by_value(image, clip_value_min=0.0, clip_value_max=1.0)
    
    
def get_dimension(layer_outputs):
    return [layer_outputs[name].get_shape().as_list() for name in layer_outputs.keys()]


def style_content_loss(outputs):
    style_outputs = outputs['style']
    content_outputs = outputs['content']
    
    style_outputs_dim = get_dimension(style_outputs)
    
    style_loss = tf.add_n([tf.reduce_sum((style_outputs[name]-style_targets[name])**2) / (dim[1]*dim[2])**2
                           for name, dim in zip(style_outputs.keys(), style_outputs_dim)])
    style_loss *= style_weight / num_style_layers

    content_loss = tf.add_n([tf.reduce_mean((content_outputs[name]-content_targets[name])**2)
                             for name in content_outputs.keys()])
    content_loss *= content_weight / num_content_layers
    loss = style_loss + content_loss
    
    return loss


@tf.function()
def train_step(image):
    with tf.GradientTape() as tape:
        outputs = extractor(image)
        loss = style_content_loss(outputs) + total_variation_weight*tf.image.total_variation(image)

    grad = tape.gradient(loss, image)
    opt.apply_gradients([(grad, image)])


def get_parameters(style_weight_select, quality_select):
    style_weight = 50
    if style_weight_select == "Realistic +":
        style_weight = 1.0
    if style_weight_select == "Realistic":
        style_weight = 10
    if style_weight_select == "Artistic":
        style_weight = 100
    if style_weight_select == "Artistic +":
        style_weight = 1000
    epochs = 100
    if quality_select == "Low":
        epochs = 50
    if quality_select == "High":
        epochs = 200
    return style_weight, epochs


content_image_path = sys.argv[1]
style_image_path = sys.argv[2]
merged_image_path = sys.argv[3]
style_weight_select = sys.argv[4]
quality_select = sys.argv[5]

content_image = load_img(content_image_path)
style_image = load_img(style_image_path)

# Content layer of interest
content_layers = ['block1_conv2']

# Style layer of interest
style_layers = ['block2_conv1',
                'block3_conv1',
                'block4_conv1']

num_content_layers = len(content_layers)
num_style_layers = len(style_layers)

class StyleContentModel(tf.keras.models.Model):
    def __init__(self, style_layers, content_layers):
        super(StyleContentModel, self).__init__()
        self.vgg = vgg_layers(style_layers + content_layers)
        self.style_layers = style_layers
        self.content_layers = content_layers
        self.num_style_layers = len(style_layers)
        self.vgg.trainable = False
        
    def call(self, inputs):
        # Expects float input in [0,1]
        inputs = inputs*255.0
        preprocessed_input = tf.keras.applications.vgg16.preprocess_input(inputs)
        outputs = self.vgg(preprocessed_input)
        style_outputs, content_outputs = (outputs[:self.num_style_layers],
                                          outputs[self.num_style_layers:])

        style_outputs = [gram_matrix(style_output)
                         for style_output in style_outputs]

        content_dict = {content_name:value
                        for content_name, value
                        in zip(self.content_layers, content_outputs)}

        style_dict = {style_name:value
                      for style_name, value
                      in zip(self.style_layers, style_outputs)}
        
        return {'content':content_dict, 'style':style_dict}

extractor = StyleContentModel(style_layers, content_layers)

style_targets = extractor(style_image)['style']
content_targets = extractor(content_image)['content']

image = tf.Variable(content_image)

# optimal: 0.05
opt = tf.optimizers.Adam(learning_rate=0.05)

style_weight, epochs = get_parameters(style_weight_select, quality_select)
content_weight=1.0
total_variation_weight=style_weight / 1000

print('{ ' + '"type": "initialized"' + ' }', flush=True)

start = time.time()

for n in range(epochs):
    train_step(image)
    print('{ ' + '"type": "progress", "value": "{}"'.format(round((n+1) / epochs * 100)) + '}', flush=True)

image.assign(clip_0_1(image))
end = time.time()
print('{ ' + '"type": "time", "value": "{:.1f}s"'.format(end-start) + ' }', flush=True)

result = tensor_to_image(image)
result.save(merged_image_path)
print('{ ' + '"type": "result", "value": "../temp{}"'.format(merged_image_path.split("temp")[1]) + ' }', flush=True)
