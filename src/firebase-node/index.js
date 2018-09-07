// Patches for loading angularfire in a Universal Context

global['WebSocket'] = require("ws");
global['XMLHttpRequest'] = require("xhr2");
