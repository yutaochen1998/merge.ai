$(document).ready(function() {

    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_image_deliver');
    const image_result = $("#image_result")
    const download_link = $("#download_link")
    const download_button = $("#download_button")

    connection.onmessage = (event) => {

        const data_parsed = JSON.parse(event.data);
        console.log("result path: " + data_parsed.result_path)
        image_result.attr("src", data_parsed.result_path);
        download_link.attr("href", data_parsed.result_path);
        download_button.attr("disabled", false);

    };

});