const fs = require('fs');
const path = require("path");
const nconf = require('nconf');

//Init config
if(!fs.existsSync(__dirname + "/../run/config.json") ) {
	fs.writeFileSync(__dirname + "/../run/config.json", JSON.stringify(require(__dirname + "/../run/config-defaults.json"), null, 2));
}

nconf.argv().env();
nconf.file({ file: __dirname + "/../run/config.json" });

//Start server
const server_port = nconf.get("server:port");

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const { Server } = require("socket.io");
const ws_server = new Server(server);

server.listen(server_port, () => {
	console.log('Listening on port ' + server_port + '\n');
});

//Utils
function getClientPagePath(page) {
	return path.resolve(__dirname, nconf.get("server:client_pages") + "/" + page);
}

function registerStatic(path, clientPath=null) {
	if (clientPath == null) {
		app.use("/" + path, express.static(getClientPagePath(path)));
	} else {
		app.use("/" + path, express.static(getClientPagePath(clientPath)));
	}
}

//Exports
module.exports = {
	express: express,
	server: server,
	app: app,

	ws_server: ws_server,

	nconf: nconf,

	getClientPagePath: getClientPagePath,
	registerStatic: registerStatic
}