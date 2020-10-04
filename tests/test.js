const suite = require('mocha').suite;
const test = require('mocha').test;
const assert = require('assert');

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

suite("Return message from Python", function() {
    test("testing return message", function () {
        const spawn = require("child_process").spawn;
        const path = "C:/My Stuff/MyCodes/Final Year Project/merge.ai/tests/test_python.py"
        const t_1 = "Artistic";
        const t_2 = "High";
        let msg = "";
        const pythonProcess = spawn('python',[path, t_1, t_2])
        pythonProcess.stdout.on('data', (data) => {
            // Do something with the data returned from python script
            msg = data.toString().trim();
            console.log(msg)
            assert(msg === "100 200", "Return message not trimmed or correctly sent!");
        });
    })
});