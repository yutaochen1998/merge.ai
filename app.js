#!/usr/bin/env node

//import modules
const express = require("express");
require("pug");
const app = express();

//configure express app
app.use(express.static(__dirname));
app.set('view engine', 'pug');

//start server and render homepage
const port = 3000;
app.get('/', function(req, res) {
    res.set({
        'Access-Control-Allow-Origin': '*'
    });
    res.render('test', {title: 'Homepage'});
}).listen(process.env.PORT || port, function() {
    console.log("Server listening at port " + port);
});


