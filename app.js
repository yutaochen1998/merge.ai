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
    res.render('welcome_page', {title: 'Welcome to Merge.AI!'});
}).listen(process.env.PORT || port, function() {
    console.log("Server listening at port " + port);
});

//render sign up page
app.get('/sign_up_page', function(req, res) {
    res.render('sign_up_page', {title: 'Sign up'});
});

//render login page
app.get('/login_page', function(req, res) {
    res.render('login_page', {title: 'Login'});
});
