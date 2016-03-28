var d2gsi = require('../index.js');

var server = new d2gsi();

server.events.on('newclient', function(client) {
    console.log("New client connection, IP address: " + client.ip + ", Auth token: " + client.auth);

    client.on('hero:name', function(hero_name) {
        console.log("new emit from hero:name - " + hero_name);
    });
    client.on('player:name', function(player_name) {
        console.log("new emit from player:name - " + player_name);
    });
});

