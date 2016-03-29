var d2gsi = require('../index.js');
var server = new d2gsi();

var clients = [];

server.events.on('newclient', function(client) {
    console.log("New client connection, IP address: " + client.ip + ", Auth token: " + client.auth);
    clients.push(client);
});

setInterval(function() {
    clients.forEach(function(client, index) {
        if (client.gamestate.hero && client.gamestate.hero.level) {
            console.log("Client " + index + " is level " + client.gamestate.hero.level);
        }
    });
}, 10 * 1000); // Every ten seconds