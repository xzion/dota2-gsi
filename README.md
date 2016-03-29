# Node.js Dota 2 GSI module

`dota2-gsi` provides an event driven interface for Dota 2's live GameState Integration data. When configured, the Dota client will send regular messages to the `dota2-gsi` server, which emits an event for each attribute whenever it changes.

## Installation

`npm install dota2-gsi`

## Usage

```javascript
var d2gsi = require('dota2-gsi');
var server = new d2gsi([options]);
```

The server can be configured by passing an optional object to the constructor:
```
{
    port: The port that the server should listen on (default: 3000),
    tokens: A single string or array of strings that are valid auth tokens (default: no auth required)
}
```

The server has one member
```
server.events - An EventEmitter used to notify when new clients connect
```

## Examples

Using events
```javascript
var d2gsi = require('dota2-gsi');
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
    })
});
```

Polling the gamestate manually. There is no guarantee that all of the objects in the gamestate exist, so be sure to null check or use a try/catch when polling.
```javascript
var d2gsi = require('dota2-gsi');
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
```

Identifying different clients. Unique auth tokens are the easiest way to do this.
```javascript
var d2gsi = require('dota2-gsi');
var server = new d2gsi({
    port: 9001,
    tokens: [
        "6hCG4n_team1_player1",
        "6hCG4n_team1_player2",
        "6hCG4n_team1_player3",
        "6hCG4n_team1_player4",
        "6hCG4n_team1_player5"
    ]
});

server.events.on('newclient', function(client) {
    if (client.auth == "6hCG4n_team1_player1") {
        console.log("Client 1:1 connected");
        client.on('hero:name', function(hero_name) {
            set_LAN_booth_display(1, 1, hero_name); // Set the displays on the TI booths for example
        });
    }
});
```

## Clients and Events

The server `events` member emits the `newclient` event whenever a new client connects (based on IP address), returning the new client object. Each client has three members:

```
client.ip           - IP address of the client
client.auth         - Auth token used by the client (may be null)
client.gamestate    - The latest gamestate received from the client
```

Clients will emit the following events any time they change.

```
newdata - The entire raw json object sent from the Dota client

provider:name
provider:appid
provider:version
provider:timestamp

map:name
map:matchid
map:gametime
map:clocktime
map:isdaytime
map:isnightstalker_night
map:gamestate
map:win_team
map:customgamename
map:ward_purchase_cooldown

player:steamid
player:name
player:activity
player:kills
player:deaths
player:assists
player:last_hits
player:denies
player:kill_streak
player:team_name
player:gold
player:gold_reliable
player:gold_unreliable
player:gpm
player:xpm

hero:id
hero:name
hero:level
hero:alive
hero:respawn_seconds
hero:buyback_cost
hero:buyback_cooldown
hero:health
hero:max_health
hero:health_percent
hero:mana
hero:max_mana
hero:mana_percent
hero:silenced
hero:stunned
hero:disarmed
hero:magicimmune
hero:hexed
hero:muted
hero:break
hero:has_debuff

items:slot#:name
items:slot#:contains_rune
items:slot#:can_cast
items:slot#:cooldown
items:slot#:passive
items:slot#:charges
items:stash#:name
items:stash#:contains_rune
items:stash#:can_cast
items:stash#:cooldown
items:stash#:passive
items:stash#:charges

abilities:ability#:name
abilities:ability#:level
abilities:ability#:can_cast
abilities:ability#:passive
abilities:ability#:ability_active
abilities:ability#:cooldown
abilities:ability#:ultimate
abilities:attributes:level
```

The gamestate object mirrors this structure. For example
```
client.gamestate.hero.mana_percent
client.gamestate.items.slot0.name
```

## Quirks
* The client does not announce all keys in an 'added' event, so there's no initial emit for some child attributes. This includes all of `provider`, `map`, and some of `player`. If you're trying to initialise values such as `map:isdaytime`, the easiest way to achieve it is to wait on the first `map:gametime` event then manually query the values from the gamestate.
* Item and hero names are returned as strings using the console format. Dota 2 Wiki has a list of translations for [items](http://dota2.gamepedia.com/Cheats#Item_names) and [heroes](http://dota2.gamepedia.com/Cheats#Hero_names).


## Configuring the Dota 2 Client

To configure the Dota client to report gamestate, you need to add a config file in `steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration\`. The file must use the name pattern called `gamestate_integration_*.cfg`, for example `gamestate_integration_dota2-gsi.cfg`.

The following example is included in this repository, you can copy it straight into your Dota directory to get started.
```
"dota2-gsi Configuration"
{
    "uri"               "http://localhost:3000/"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.1"
    "heartbeat"         "30.0"
    "data"
    {
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
        "abilities"     "1"
        "items"         "1"
    }
    "auth"
    {
        "token"         "hello1234"
    }
}
```

For more information, see the [CS:GO GameState Integration page](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration)

## Caveats

The data provided is fairly extensive, but it is specific to the player running the Dota 2 client. It does not provide any information to spectators or casters. The only way to get live information about all players in a game is to have each player configure their Dota client to point to the same `dota2-gsi` server. This somewhat limits the usefulness of the interface for tournament production; it's only really viable for LAN's. The other thing lacking is map position. I'd like to see Valve expand the interface in future to include live map position, and add `allplayers` sections similar to CS:GO, so casters and spectators can use the information for online games.

## Credits

Shoutout to [/u/antonpup](https://www.reddit.com/user/antonpup) for his [C# Gamestate Integration server](https://github.com/antonpup/Dota2GSI) and inadvertently letting me know this existed.