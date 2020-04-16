$(document).ready(function() {

    const port = 3000;
    const connection = new WebSocket('ws://localhost:' + port + '/websocket_image_deliver');
    const image_result = $("#image_result")

    connection.onopen = () => {
        //do something
    };

    connection.onmessage = (event) => {

        const data_parsed = JSON.parse(event.data);
        console.log("result path: " + data_parsed.result_path)
        image_result.attr("src", data_parsed.result_path);
    };

});