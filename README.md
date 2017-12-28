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
    ip: The IP address that the server should listen on (default: "0.0.0.0"),
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
    console.log("New client connection, IP address: " + client.ip);
    if (client.auth && client.auth.token) {
        console.log("Auth token: " + client.auth.token);
    } else {
        console.log("No Auth token");
    }

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
```

Polling the gamestate manually. There is no guarantee that all of the objects in the gamestate exist, so be sure to null check or use a try/catch when polling.
```javascript
var d2gsi = require('dota2-gsi');
var server = new d2gsi();

var clients = [];

server.events.on('newclient', function(client) {
    console.log("New client connection, IP address: " + client.ip);
    if (client.auth && client.auth.token) {
        console.log("Auth token: " + client.auth.token);
    } else {
        console.log("No Auth token");
    }
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

Identifying different clients using unique auth tokens. With the changes that allow observers/spectators to receive all data this usually isn't necessary any longer, unless you want to allow multiple spectators to join the server for redundancy.
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
    if (client.auth && client.auth.token == "6hCG4n_team1_player1") {
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
client.auth.token   - Auth token used by the client (auth or auth.token may be null)
client.gamestate    - The latest gamestate received from the client
```

Clients will emit the following events any time they change. This list may not be complete, as Valve can silently change the key names or add news ones at any time. If you discover some new outputs, please send a pull request!

All ```team#``` references may either be ```team2``` for Radiant, or ```team3``` for Dire. All ```player#``` references range from ```player0``` to ```player9```, where 0-4 are the Radiant team and 5-9 are the Dire.

```
newdata - The entire raw json object sent from the Dota client
```

<details>
    <summary>Provider</summary>

    provider:name
    provider:appid
    provider:version
    provider:timestamp
</details>

<details>
    <summary>Map</summary>

    map:clock_time
    map:daytime
    map:dire_ward_purchase_cooldown
    map:game_state
    map:game_time
    map:name
    map:matchid
    map:radiant_ward_purchase_cooldown
    map:nightstalker_night
    map:roshan_state
    map:roshan_state_end_seconds
    map:win_team
    map:customgamename
</details>

<details>
    <summary>Player</summary>

    player:team#:player#:assists
    player:team#:player#:camps_stacked
    player:team#:player#:deaths
    player:team#:player#:denies
    player:team#:player#:gold
    player:team#:player#:gold_reliable
    player:team#:player#:gold_unreliable
    player:team#:player#:gpm
    player:team#:player#:hero_damage
    player:team#:player#:kill_list:victimid_#
    player:team#:player#:kill_streak
    player:team#:player#:kills
    player:team#:player#:last_hits
    player:team#:player#:net_worth
    player:team#:player#:pro_name
    player:team#:player#:runes_activated
    player:team#:player#:support_gold_spent
    player:team#:player#:wards_destroyed
    player:team#:player#:wards_placed
    player:team#:player#:wards_purchased
    player:team#:player#:xpm
</details>

<details>
    <summary>Hero</summary>

    hero:team#:player#:alive
    hero:team#:player#:break
    hero:team#:player#:buyback_cost
    hero:team#:player#:buyback_cooldown
    hero:team#:player#:disarmed
    hero:team#:player#:has_debuff
    hero:team#:player#:health
    hero:team#:player#:health_percent
    hero:team#:player#:hexed
    hero:team#:player#:id
    hero:team#:player#:level
    hero:team#:player#:magicimmune
    hero:team#:player#:mana
    hero:team#:player#:mana_percent
    hero:team#:player#:max_health
    hero:team#:player#:max_mana
    hero:team#:player#:muted
    hero:team#:player#:name
    hero:team#:player#:respawn_seconds
    hero:team#:player#:selected_unit
    hero:team#:player#:silenced
    hero:team#:player#:stunned
    hero:team#:player#:talent_# (1-8)
    hero:team#:player#:xpos
    hero:team#:player#:ypos
</details>

<details>
    <summary>Items</summary>

    items:team#:player#:slot#:can_cast
    items:team#:player#:slot#:charges
    items:team#:player#:slot#:contains_rune
    items:team#:player#:slot#:cooldown
    items:team#:player#:slot#:name
    items:team#:player#:slot#:passive
    items:team#:player#:slot#:purchaser

    items:team#:player#:stash#:can_cast
    items:team#:player#:stash#:charges
    items:team#:player#:stash#:contains_rune
    items:team#:player#:stash#:cooldown
    items:team#:player#:stash#:name
    items:team#:player#:stash#:passive
    items:team#:player#:stash#:purchaser
</details>

<details>
    <summary>Abilities</summary>

    abilities:team#:player#:ability#:ability_active
    abilities:team#:player#:ability#:can_cast
    abilities:team#:player#:ability#:cooldown
    abilities:team#:player#:ability#:level
    abilities:team#:player#:ability#:name
    abilities:team#:player#:ability#:passive
    abilities:team#:player#:ability#:ultimate
</details>

<details>
    <summary>Buildings</summary>

    buildings:radiant:dota_goodguys_tower#_top.health (1-4)
    buildings:radiant:dota_goodguys_tower#_top.max_health
    buildings:radiant:dota_goodguys_tower#_mid.health (1-3)
    buildings:radiant:dota_goodguys_tower#_mid.max_health
    buildings:radiant:dota_goodguys_tower#_bot.health (1-4)
    buildings:radiant:dota_goodguys_tower#_bot.max_health
    buildings:radiant:good_rax_range_top.health
    buildings:radiant:good_rax_range_top.max_health
    buildings:radiant:good_rax_melee_top.health
    buildings:radiant:good_rax_melee_top.max_health
    buildings:radiant:good_rax_range_mid.health
    buildings:radiant:good_rax_range_mid.max_health
    buildings:radiant:good_rax_melee_mid.health
    buildings:radiant:good_rax_melee_mid.max_health
    buildings:radiant:good_rax_range_bot.health
    buildings:radiant:good_rax_range_bot.max_health
    buildings:radiant:good_rax_melee_bot.health
    buildings:radiant:good_rax_melee_bot.max_health
    buildings:radiant:dota_goodguys_fort:health
    buildings:radiant:dota_goodguys_fort:max_health

    buildings:dire:dota_badguys_tower#_top.health (1-4)
    buildings:dire:dota_badguys_tower#_top.max_health
    buildings:dire:dota_badguys_tower#_mid.health (1-3)
    buildings:dire:dota_badguys_tower#_mid.max_health
    buildings:dire:dota_badguys_tower#_bot.health (1-4)
    buildings:dire:dota_badguys_tower#_bot.max_health
    buildings:dire:bad_rax_range_top.health
    buildings:dire:bad_rax_range_top.max_health
    buildings:dire:bad_rax_melee_top.health
    buildings:dire:bad_rax_melee_top.max_health
    buildings:dire:bad_rax_range_mid.health
    buildings:dire:bad_rax_range_mid.max_health
    buildings:dire:bad_rax_melee_mid.health
    buildings:dire:bad_rax_melee_mid.max_health
    buildings:dire:bad_rax_range_bot.health
    buildings:dire:bad_rax_range_bot.max_health
    buildings:dire:bad_rax_melee_bot.health
    buildings:dire:bad_rax_melee_bot.max_health
    buildings:dire:dota_badguys_fort:health
    buildings:dire:dota_badguys_fort:max_health
</details>

<details>
    <summary>Draft</summary>

    draft:activeteam
    draft:activeteam_time_remaining
    draft:dire_bonus_time
    draft:pick
    draft:radiant_bonus_time
    draft:team#:home_team
    draft:team#:ban#_class (0-5)
    draft:team#:ban#_id (0-5)
    draft:team#:pick#_class (0-4)
    draft:team#:pick#_id (0-4)
</details>

<details>
    <summary>Wearables</summary>

    wearables:team#:player#:wearable#
    wearables:team#:player#:style#
</details>
<br>

The gamestate object mirrors this structure. For example
```
client.gamestate.abilities.team2.player0.ability1.can_cast
client.gamestate.buildings.dire.dota_badguys_fort.health
```

Child members in the gamestate object may be null, so use ```try/catch``` statements when querying it.

## Quirks
* The client does not announce all keys in an 'added' event, so there's no initial emit for some child attributes. This includes all of `provider`, `map`, and some of `player`. If you're trying to initialise values such as `map:daytime`, the easiest way to achieve it is to wait on the first `map:gametime` event then manually query the values from the gamestate.
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
        "buildings"     "1"
        "provider"      "1"
        "map"           "1"
        "player"        "1"
        "hero"          "1"
        "abilities"     "1"
        "items"         "1"
        "draft"         "1"
        "wearables"     "1"
    }
    "auth"
    {
        "token"         "hello1234"
    }
}
```

For more information, see the [CS:GO GameState Integration page](https://developer.valvesoftware.com/wiki/Counter-Strike:_Global_Offensive_Game_State_Integration)

## Caveats

Full player data is now available, but only to spectators and observers (as one would expect). The existing single player GSI data is still available, however the names of events are different to what is listed above. Please refer to previous versions of this readme or query uncomment to console logging in index.js to see which keys are available

## Credits

Shoutout to [/u/antonpup](https://www.reddit.com/user/antonpup) for his [C# Gamestate Integration server](https://github.com/antonpup/Dota2GSI) and inadvertently letting me know this existed.
