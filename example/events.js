var d2gsi = require('../index.js');
var server = new d2gsi();

server.events.on('newclient', function(client) {
    console.log("New client connection, IP address: " + client.ip + ", Auth token: " + client.auth);

    client.on('player:activity', function(activity) {
        if (activity == 'playing') console.log("Game started!");
    });
    client.on('hero:level', function(level) {
        console.log("Now level " + level);
    });
    client.on('abilities:ability0:can_cast', function(can_cast) {
        if (can_cast) console.log("Ability0 off cooldown!");
    });
});