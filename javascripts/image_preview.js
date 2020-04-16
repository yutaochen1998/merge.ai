$(document).ready(function() {

    function readURL(input, preview_id) {
        if (input.files && input.files[0]) {
            let reader = new FileReader();

            reader.onload = function(event) {
                $(preview_id).attr('src', event.target.result);
            }

            reader.readAsDataURL(input.files[0]);
        }
    }

    $("#target_image_select").change(function() {
        readURL(this, "#target_image_preview");
    });

    $("#style_image_select").change(function() {
        readURL(this, "#style_image_preview");
    });

});