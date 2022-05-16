const server = require("./server");

//Register pages
server.registerStatic("css");
server.registerStatic("js");
server.registerStatic("img");
server.registerStatic("fonts");

server.registerStatic("favicon.ico");
server.registerStatic("logo.png");

server.app.get('/', function(req, res) {
	res.sendFile(server.getClientPagePath("html/index.html"));
});

//Register games
require("./connect4/index");
require("./loupgarou/index");
require("./naughtsandcrosses/index");