var express         = require('express');
var bodyParser      = require('body-parser');
var eventEmitter    = require('events').EventEmitter;

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var events = new eventEmitter();

function newData(req, res) {
    events.emit('all:gamestate', req.body);
    res.end();
}

var d2gsi = function(port) {
    port = port || 3000;

    app.post('/', newData);

    var server = app.listen(port, function() {
        console.log('Dota 2 GSI listening on port ' + server.address().port);
    });

    this.events = events;
    return this;
}

module.exports = d2gsi;
