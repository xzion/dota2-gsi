var express         = require('express');
var bodyParser      = require('body-parser');
var eventEmitter    = require('events').EventEmitter;
var extend          = require('extend');

var events = new eventEmitter();
var clients = [];

function gsi_client (ip, auth) {
    this.ip = ip;
    this.auth = auth;
    this.gamestate = {};
}
gsi_client.prototype.__proto__ = eventEmitter.prototype;

function Check_client(req, res, next) {
    console.log("Check client");

    // Check if this IP is already talking to us
    for (var i = 0; i < clients.length; i++) {
        if (clients[i].ip == req.ip) {
            req.client = clients[i];
            return next();
        }
    }

    // Create a new client
    clients.push(new gsi_client(req.ip, req.body.auth));
    req.client = clients[clients.length - 1];

    // Notify about the new client
    events.emit('newclient', clients[clients.length - 1]);

    next();
}

function Process_section(section) {
    return function(req, res, next) {
        console.log("Process section: " + section);
        if (req.body.previously && req.body.previously[section]) {
            Object.keys(req.body.previously[section]).forEach(function(key) {
                req.client.emit(section+":"+key, req.body[section][key]);
            });
        }

        next();
    }
}

function Update_gamestate(req, res, next) {
    extend(true, req.client.gamestate, req.body);
    next();
}

function New_data(req, res) {
    console.log("Parse complete");
    res.end();
}

function Check_auth(tokens) {
    return function(req, res, next) {
        if (tokens) {
            if (req.body.auth && // Body has auth
                (req.body.auth == tokens || // tokens was a single string or
                (tokens.constructor === Array && // tokens was an array and
                tokens.indexOf(req.body.auth) != -1))) { // containing the token
                console.log("Valid auth");
                next();
            } else {
                // Not a valid auth, drop the message
                console.log("Invalid auth " + req.body.auth);
                res.end();
            }
        } else {
            console.log("No tokens, valid auth");
            next();
        }
    }
}

var d2gsi = function(options) {
    options = options || {};
    var port = options.port || 3000;
    var tokens = options.tokens || null;

    var app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.post('/', 
        Check_auth(tokens), 
        Check_client, 
        Update_gamestate, 
        Process_section('player'),
        Process_section('hero'),
        Process_section('map');
        Process_section('provider'),
        New_data);

    var server = app.listen(port, function() {
        console.log('Dota 2 GSI listening on port ' + server.address().port);
    });

    this.events = events;
    return this;
}

module.exports = d2gsi;