$(document).ready(function() {

    const port = 80;
    const connection = new WebSocket('ws://192.168.1.245:' + port + '/websocket_image_deliver');
    const image_result = $("#image_result");
    const download_link = $("#download_link");
    const download_button = $("#download_button");
    const render_progress = $("#render_progress");
    const initialization = $("#initialization");

    connection.onmessage = (event) => {

        const msg = JSON.parse(event.data);
        if (msg.type === "progress") {
            render_progress.attr("aria-valuenow", msg.value);
            render_progress.attr("style", "width:" + msg.value + "%");
            render_progress.text(msg.value + "%");
        } else if (msg.type === "initialized") {
            initialization.hide("fast");
        } else if (msg.type === "time") {
            render_progress.attr("class", "progress-bar bg-success progress-bar-striped");
            render_progress.text("Completed - Time elapsed: " + msg.value);
        } else {
            image_result.attr("src", msg.value);
            download_link.attr("href", msg.value);
            download_button.attr("disabled", false);
        }

    };

});