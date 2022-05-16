const server = require("../server");
const utils = require('../utils');
const fs = require("fs");

var game_page = "";
fs.readFile(server.getClientPagePath("html/games/loupgarou-game.html"), (err, data) => {
	game_page = data.toString();
});

server.app.get('/loupgarou', function(req, res) {
	res.sendFile(server.getClientPagePath("html/games/loupgarou.html"));;
});

server.app.post('/loupgarou/join', function(req, res) {
	if (!rooms.has(req.body.gameid)) {
		res.send(game_page.replace("{page_data}", "Cette partie n'existe pas..."));
		return;
	}

	const room_data = rooms.get(req.body.gameid);

	if (room_data.maxPlayers == room_data.players.length) {
		res.send(game_page.replace("{page_data}", "Trop de personnes ont déjà rejoint la partie..."));
		return;
	}

	const pid = utils.generateHash(6);

	for (player of room_data.players) {
		if (player.name == req.body.name) {
			res.send(game_page.replace("{page_data}", "Ce nom est déjà pris..."));
			return;
		}
		if (player.id == pid) {
			res.send(game_page.replace("{page_data}", "Un problème est survenu..."));
			return;
		}
	}

	const player_data = {
		name: req.body.name,
		id: pid,
		card: room_data.cards[room_data.players.length]
	};
	room_data.players.push(player_data);

	res.writeHead(303, {
		'Location': '/loupgarou/' + req.body.gameid  + '/' + pid
	});

	res.end();
});

server.app.post('/loupgarou/make', function(req, res) {
	const new_room_id = utils.generateHash(6);
	if (rooms.has(new_room_id)) {
		res.send(game_page.replace("{page_data}", "Un problème est survenu..."));
		return;
	}

	if (req.body.players > 18 || req.body.players < 4) {
		res.send(game_page.replace("{page_data}", "Le nombre de joueurs n'est pas valide..."));
		return;
	}

	var pFille = false;
	if (req.body.pFille == true) {
		pFille = true;
	}

	const pid = createRoom(new_room_id, req.body.players, pFille);

	res.writeHead(303, {
		'Location': '/loupgarou/' + new_room_id + '/' + pid
	});

	res.end();
});

server.app.get('/loupgarou/:room([A-Za-z0-9]{6})/:pid([A-Za-z0-9]{6})', function(req, res) {
	var data = "";

	if (rooms.has(req.params.room)) {
		const room_data = rooms.get(req.params.room);

		if (req.params.pid == room_data.narrator) {
			data = "<h2>Joueurs</h2>";
			data += "<table style=\"font-family: Arial, sans-serif; font-size: small;\" border=\"1\" cellspacing=\"0\" cellpadding=\"2\"><tr><th>Nom</th><th>Carte</th><th>Est mort</th><th>Amoureux</th></tr>";

			for (player of room_data.players) {
				const card = getCardName(player.card);
				data += "<tr><th>&nbsp;<input value=\"" + player.name + "\">&nbsp;</th><th>&nbsp;<p id=\"" + player.id + "\">" + card + "</p>&nbsp;<button onclick=\"changeFunc('" + player.id + "')\">Nouvelle carte</button><br>&nbsp;</th><th>&nbsp;<input type=\"checkbox\">&nbsp;</th><th>&nbsp;<input type=\"checkbox\">&nbsp;</th></tr>";
			}

			data += "<tr><th><i>&nbsp;Vous&nbsp;</i></th><th><i>&nbsp;Maître(sse) du jeu&nbsp;</i></th><th>&nbsp;&nbsp;</th><th>&nbsp;&nbsp;</th></tr></table>";
			data += "<button onclick=\"location.reload();\">Rafraichir</button><br><br>";

			data += "<h2>Pour inviter des joueurs:</h2>";
			data += "Utilisez le code: " + req.params.room + "<br>";

			data += "<h2>Cartes par nombre de joueurs:</h2>";
			data += "<b> 4 joueurs :</b> Loup; Voyante; Sorcière; Cupidon<br>";
			data += "<b> 5 joueurs :</b> Loup; Chasseur; Voyante; Sorcière; Cupidon<br>";
			data += "<b> 6 joueurs :</b> Loup x2; Chasseur; Voyante; Sorcière; Cupidon<br>";
			data += "<b> 7 joueurs :</b> Loup x2; Chasseur; Voyante; Sorcière; Cupidon; Voleur<br>";
			data += "<b> 8 joueurs :</b> Loup x2; Chasseur; Voyante; Sorcière; Cupidon; Villageois; Voleur<br>";
			data += "<b> 9 joueurs :</b> Loup x2; Chasseur; Voyante; Sorcière; Cupidon; Villageois x2; Voleur<br>";
			data += "<b>10 joueurs :</b> Loup x2; Chasseur; Voyante; Sorcière; Cupidon; Villageois x3; Voleur<br>";
			data += "<b>11 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x3; Voleur<br>";
			data += "<b>12 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x4; Voleur<br>";
			data += "<b>13 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x5; Voleur<br>";
			data += "<b>14 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x6; Voleur<br>";
			data += "<b>15 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x7; Voleur<br>";
			data += "<b>16 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x8; Voleur<br>";
			data += "<b>17 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x9; Voleur<br>";
			data += "<b>18 joueurs :</b> Loup x3; Chasseur; Voyante; Sorcière; Cupidon; Villageois x10; Voleur<br>";

			data += "<br><br>"
		} else {
			for (player of room_data.players) {
				if (player.id == req.params.pid) {
					const card = getCardName(player.card);

					data += "<img src=\"/img/loupgarou-cards/" + player.card + ".jpg\" alt=\"" + card + "\">";
					data += "<br>" + card;
					break;
				}
			}
		}
	} else {
		data = "Cette partie n'existe pas...";
	}

	res.send(game_page.replace("{page_data}", data));
});

//Rooms list
const rooms = new Map();

//Utils
function createRoom(id, players, pFille) {
	let playerCards;
	if (players == 4) {
		playerCards = ["L","Vy","S","Cu"];
	} else if (players == 5) {
		playerCards = ["L","Ch","Vy","S","Cu"];
	} else if (players == 6) {
		playerCards = ["L","Ch","Vy","S","Cu","L"];
	} else if (players == 7) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vo"];
	} else if (players == 8) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vo","P"];
	} else if (players == 9) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vo","Vi","P"];
	} else if (players == 10) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","P","Vo"];
	} else if (players == 11) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","Vo"];
	} else if (players == 12) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vo"];
	} else if (players == 13) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vi","Vo"];
	} else if (players == 14) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vi","Vi","Vo"];
	} else if (players == 15) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vi","Vi","Vi","Vo"];
	} else if (players == 16) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vi","Vi","Vi","Vi","Vo"];
	} else if (players == 17) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vi","Vi","Vi","Vi","Vi","Vo"];
	} else if (players == 18) {
		playerCards = ["L","Ch","Vy","S","Cu","L","Vi","Vi","Vi","P","L","Vi","Vi","Vi","Vi","Vi","Vi","Vo"];
	}

	const indexOfP = playerCards.indexOf("P");
	if (!pFille && indexOfP > -1) {
		playerCards[indexOfP] = "Vi";
	}
	playerCards = utils.shuffleArray(playerCards);

	const narrator = utils.generateHash(6);

	rooms.set(id, {
		cards: playerCards,
		maxPlayers: players,
		narrator: narrator,
		players: []
	});

	return narrator;
}

function getCardName(name) {
	if (name == "Vi") {
		return "Chasseur";
	} else if (name == "L") {
		return "Loup Garou";
	} else if (name == "Ch") {
		return "Chasseur";
	} else if (name == "Vy") {
		return "Voyante";
	} else if (name == "S") {
		return "Sorcière";
	} else if (name == "Cu") {
		return "Cupidon";
	} else if (name == "Vo") {
		return "Voleur";
	} else if (name == "P") {
		return "Petite Fille";
	} else {
		return "ERROR";
	}
}