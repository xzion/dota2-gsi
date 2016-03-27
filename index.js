var express         = require('express');
var bodyParser      = require('body-parser');
var eventEmitter    = require('events').EventEmitter;
var extend          = require('extend');

var events = new eventEmitter();

var item = {
    name: null,
    contains_rune: null,
    can_cast: null,
    colldown: null,
    passive: null,
    charges: null
};

var ability = {
    name: null,
    level: null,
    can_cast: null,
    passive: null,
    ability_active: null,
    cooldown: null,
    ultimate: null
};

var attribute = {
    level: null
}

function gsi_client (ip, auth) {
    this.ip = ip;
    this.auth = auth;
    this.gamestate = {};

    this.gsibase = {
        auth: null,
        provider: {
            name: null,
            appid: null,
            version: null,
            timestamp: null
        },
        map: {
            name: null,
            matchid: null,
            gametime: null,
            clocktime: null,
            isdaytime: null,
            isnightstalker_night: null,
            gamestate: null,
            win_team: null,
            customgamename: null,
            ward_purchase_cooldown: null
        },
        player: {
            steamid: null,
            name: null,
            activity: null,
            kills: null,
            deaths: null,
            assists: null,
            last_hits: null,
            denies: null,
            kill_streak: null,
            team_name: null,
            gold: null,
            gold_reliable: null,
            gold_unreliable: null,
            gpm: null,
            xpm: null
        },
        hero: {
            id: null,
            name: null,
            level: null,
            alive: null,
            respawn_seconds: null,
            buyback_cost: null,
            buyback_cooldown: null,
            health: null,
            max_health: null,
            health_percent: null,
            mana: null,
            max_mana: null,
            mana_percent: null,
            silenced: null,
            stunned: null,
            disarmed: null,
            magicimmune: null,
            hexed: null,
            muted: null,
            break: null,
            has_debuff: null,
        },
        abilities: [],
        items: [],
    };
}

gsi_client.prototype.__proto__ = eventEmitter.prototype;

var clients = [];

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

function Process_player(req, res, next) {
    console.log("Process player");
    if (req.body.previously && req.body.previously.player) {
        Object.keys(req.body.previously.player).forEach(function(key) {
            req.client.emit("player:"+key, req.body.player[key]);
        })
    }

    next();
}


function Update_gamestate(req, res, next) {
    console.log("extend");
    extend(true, req.client.gamestate, req.body);
    console.log(req.client.gamestate);
    next();
}

function New_data(req, res) {
    req.client.emit('player', req.body);
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
        Process_player,
        New_data);

    var server = app.listen(port, function() {
        console.log('Dota 2 GSI listening on port ' + server.address().port);
    });

    this.events = events;
    return this;
}

module.exports = d2gsi;
