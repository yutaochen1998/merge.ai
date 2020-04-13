#!/usr/bin/env node

//import modules
const express = require("express");
require("pug");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const fs = require('fs');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const crypto = require('crypto');
require('express-ws')(app);

//configure express app
app.use(express.static(__dirname));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'Final Year Project',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: false}
}));
app.use(fileUpload({
    limits: {fileSize: 4 * 1024 * 1024} //limit image size at 4MB
}));

//configure mongodb connection
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false');

//set up mongodb connection
const db = mongoose.connection;
db.on('error', console.log.bind(console, "MongoDB connection error"));
db.once('open', function() {
    console.log("Connected to MongoDB");
});

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

//handle sign up request
app.post('/sign_up', function(req, res) {
    const username = req.body.username_sign_up;
    const email = req.body.email_sign_up;
    let password = req.body.password_sign_up;

    db.collection('Accounts').findOne({$or: [{username: username}, {email: email}]}, function (err, result) {
        if (!result) {

            //hash password before saving to the database
            password = crypto.createHmac('sha1', password).update(password).digest('hex');

            const new_account = {
                username: username,
                email: email,
                password: password,
                //bellow are reserved as placeholder
                profile_photo: {data: fs.readFileSync('images/default_profile_photo.png').toString('base64'),
                    content_type: 'image/png'},
            };
            db.collection('Accounts').insertOne(new_account, function(err) {
                if (err) throw err;
                console.log("Account registration successful");
            });
            res.render('sign_up_successful', {title: 'Sign up successful!'});
        } else {
            console.log("Account exists!");
            res.render('sign_up_failed', {title: 'Sign up failed!'});
        }
    });
});

//render login page
app.get('/login_page', function(req, res) {
    res.render('login_page', {title: 'Login'});
});

//handle login request
app.post('/login', function(req, res) {

    const email = req.body.email_login;
    let password = req.body.password_login;

    db.collection('Accounts').findOne({email: email}, function (err, result) {
        if (err) throw err;
        if (!result) {
            console.log("Account doesn't exists");
            res.render('login_failed', {title: 'Login failed', error_message: "Account doesn't exists!"});
        } else {
            //hash password before comparing with that in the database
            password = crypto.createHmac('sha1', password).update(password).digest('hex');
            if (result.password !== password) {
                console.log("Password incorrect");
                res.render('login_failed', {title: 'Login failed', error_message: "Password incorrect!"});
            } else {
                req.session.email = email;
                req.session.username = result.username;
                req.session.profile_photo_data = result.profile_photo.data;
                req.session.profile_photo_content_type = result.profile_photo.content_type;
                console.log("Login successful, user ID: " + req.session.email);
                res.redirect('/main_activity');
            }
        }
    });
});

//render main activity page
app.get('/main_activity', function(req, res) {
    // Testing python script
    const spawn = require("child_process").spawn;
    const pythonProcess = spawn('python',["C:/My Stuff/MyCodes/Final Year Project/merge.ai/python/test.py"]);
    pythonProcess.stdout.on('data', (data) => {
        // Do something with the data returned from python script
        console.log(data.toString());
    });

    res.render('main_activity', {
        title: "Merge.AI",
        username: req.session.username,
        profile_photo_top_left: req.session.profile_photo_data,
        profile_photo_content_type_top_left: req.session.profile_photo_content_type
    });
});

//render account info page
app.get('/account_info', function(req, res) {
    res.render('account_info', {
        title: "Account Info",
        profile_photo_top_left: req.session.profile_photo_data,
        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        userID: req.session.email,
        username: req.session.username,
        profile_photo: req.session.profile_photo_data,
        profile_photo_content_type: req.session.profile_photo_content_type
    });
});

//render change username page
app.get('/change_username_page', function(req, res) {
    res.render('change_username_page', {
        title: 'Change username',

        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        profile_photo_top_left: req.session.profile_photo_data
    });
});

//handle change username request
app.post('/change_username', function(req, res) {

    let username = req.body.username_change;

    db.collection('Accounts').findOne({email: req.session.email}, function (err, result) {
        if (err) throw err;
        if (username === result.username) {
            res.render('change_username_result',
                {title: 'Username change failed!',
                    message: 'Please use different username.',

                    profile_photo_content_type_top_left: req.session.profile_photo_content_type,
                    profile_photo_top_left: req.session.profile_photo_data
                });
            console.log("Same username, failed to commit");
        } else {
            db.collection("Accounts").updateOne({email: req.session.email},
                {$set: {username: username}}, function(err) {
                    if (err) throw err;
                });
            req.session.username = username;
            res.render('change_username_result',
                {title: 'Username change successful!',
                    message: 'Click Return to go back.',

                    profile_photo_content_type_top_left: req.session.profile_photo_content_type,
                    profile_photo_top_left: req.session.profile_photo_data
                });
            console.log("Username change successful");
        }
    });
});

//render change password page
app.get('/change_password_page', function(req, res) {
    res.render('change_password_page', {
        title: 'Change password',

        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        profile_photo_top_left: req.session.profile_photo_data
    });
});

//handle change password request
app.post('/change_password', function(req, res) {

    let password = req.body.password_change;
    //hash password before comparison
    password = crypto.createHmac('sha1', password).update(password).digest('hex');

    db.collection('Accounts').findOne({email: req.session.email}, function (err, result) {
        if (err) throw err;
        if (password === result.password) {
            res.render('change_password_result',
                {title: 'Password change failed!',
                    message: 'Please use different password.',
                    button_action: 'javascript:history.back()',
                    button_value: 'Return',

                    profile_photo_content_type_top_left: req.session.profile_photo_content_type,
                    profile_photo_top_left: req.session.profile_photo_data
                });
            console.log("Same password, failed to commit");
        } else {
            db.collection("Accounts").updateOne({email: req.session.email},
                {$set: {password: password}}, function(err) {
                    if (err) throw err;
                });
            res.render('change_password_result',
                {title: 'Password change successful!',
                    message: 'Please re-login to your account.',
                    button_action: '/logout',
                    button_value: 'Logout',

                    profile_photo_content_type_top_left: req.session.profile_photo_content_type,
                    profile_photo_top_left: req.session.profile_photo_data
                });
            console.log("Password change successful");
        }
    });
});

//render delete account confirm page
app.get('/delete_account_confirm', function (req, res) {
    res.render('delete_account_confirm', {
        title: 'Confirm before you go',

        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        profile_photo_top_left: req.session.profile_photo_data
    });
});

//handle delete account request
app.get('/delete_account', function(req, res) {
    db.collection('Accounts').deleteOne({email: req.session.email}, function(err) {
        if (err) throw err;
    });
    console.log('Account delete successful, user ID: ' + req.session.email);
    res.redirect('/logout');
});

//render merge image page
app.get('/merge_page', function (req, res) {
    res.render('merge_page', {
        title: 'Compose your art work',

        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        profile_photo_top_left: req.session.profile_photo_data
    });
});

//render tutorial page
app.get('/tutorial_page', function (req, res) {
    res.render('tutorial_page', {
        title: 'Tutorial',

        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        profile_photo_top_left: req.session.profile_photo_data
    });
});

//render gallery page
app.get('/gallery_page', function (req, res) {
    res.render('gallery_page', {
        title: 'Gallery',

        profile_photo_content_type_top_left: req.session.profile_photo_content_type,
        profile_photo_top_left: req.session.profile_photo_data
    });
});

//handle logout request
app.get('/logout', function(req, res) {
    console.log('Logout successful, user ID: ' + req.session.email);
    req.session.destroy();
    res.redirect('/');
});