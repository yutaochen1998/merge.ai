import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import PIL.Image
import base64
import sys
import cv2

def tensor_to_image(tensor):
    tensor = tensor*255
    tensor = np.array(tensor, dtype=np.uint8)
    if np.ndim(tensor)>3:
        assert tensor.shape[0] == 1
        tensor = tensor[0]
    return PIL.Image.fromarray(tensor)

#binary_content = base64.b64decode(sys.argv[0])
#binary_style = base64.b64decode(sys.argv[1])

content_image_path = sys.argv[1]
style_image_path = sys.argv[2]
merged_image_path = sys.argv[3]

#content_image = np.asarray(bytearray(binary_content), dtype="uint8")
#style_image = np.asarray(bytearray(binary_style), dtype="uint8")

#content_image = cv2.cvtColor(cv2.imdecode(content_image, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
#style_image = cv2.cvtColor(cv2.imdecode(style_image, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)

# Load content and style images (see example in the attached colab).
content_image = plt.imread(content_image_path)
style_image = plt.imread(style_image_path)
# Convert to float32 numpy array, add batch dimension, and normalize to range [0, 1]. Example using numpy:
content_image = content_image.astype(np.float32)[np.newaxis, ...] / 255.
style_image = style_image.astype(np.float32)[np.newaxis, ...] / 255.
# Optionally resize the images. It is recommended that the style image is about
# 256 pixels (this size was used when training the style transfer network).
# The content image can be any size.
style_image = tf.image.resize(style_image, (256, 256))

# Load image stylization module.
hub_module = hub.load('C:/Users/yutao/Desktop/test_2/tmp/')

# Stylize image.
outputs = hub_module(tf.constant(content_image), tf.constant(style_image))
stylized_image = outputs[0]
result = tensor_to_image(stylized_image)
result.save(merged_image_path)
print("completed")
