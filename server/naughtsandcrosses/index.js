const server = require("../server");
const game_logic = require("./game_logic");
const utils = require('../utils');
const game_prefix = 'naughtsandcrosses:'

server.app.get('/naughtsandcrosses', function(req, res){
	res.writeHead(302, {
		'Location': '/naughtsandcrosses/' + utils.generateHash(6)
	});

	res.end();
})

server.app.get('/naughtsandcrosses/:room([A-Za-z0-9]{6})', function(req, res) {
	res.sendFile(server.getClientPagePath("html/games/naughtsandcrosses.html"));
});

//Rooms list
var rooms = [];

server.ws_server.on('connection', function (socket) {
	socket.on(game_prefix + 'join', function(data) {
		if (data.room in game_logic.games) {
			var game = game_logic.games[data.room];

			if (typeof game.player2 != 'undefined') {
				socket.emit(game_prefix + 'full');
				return;
			}

			console.log('Room ' + data.room + ': Player 2 is here');

			socket.join(data.room);
			rooms.push(data.room);

			socket.room = data.room;
			socket.pid = 2;
			socket.hash = utils.generateHash(8);

			game.player2 = socket;
			socket.opponent = game.player1;
			game.player1.opponent = socket;

			socket.emit(game_prefix + 'assign', {pid: socket.pid, hash: socket.hash});

			game.turn = Math.floor(Math.random() * 2) + 1;
			socket.emit(game_prefix + 'start', game.turn);
			game.player1.emit(game_prefix + 'start', game.turn);
		} else {
			console.log('Room ' + data.room + ': Player 1 is here');

			if (rooms.indexOf(data.room) <= 0) {
				socket.join(data.room);
			}

			socket.room = data.room;
			socket.pid = 1;
			socket.hash = utils.generateHash(8);

			game_logic.games[data.room] = {
				player1: socket,
				moves: 0,
				board: [0,0,0,
						0,0,0,
						0,0,0]
			};

			rooms.push(data.room);
			socket.emit(game_prefix + 'assign', {pid: socket.pid, hash: socket.hash});
		}

		socket.on(game_prefix + 'make_move', function(data) {
			var game = game_logic.games[socket.room];

			if (data.hash = socket.hash && game.turn == socket.pid) {
				var move_made = game_logic.make_move(socket.room, data.box, socket.pid);
				if (move_made) {
					game.moves = parseInt(game.moves) + 1;
					socket.broadcast.to(socket.room).emit(game_prefix + 'move_made', {pid: socket.pid, box: data.box});
					game.turn = socket.opponent.pid;

					var winner = game_logic.check_for_win(game.board);

					if (winner) {
						socket.emit(game_prefix + 'winner', {winner: winner});
						socket.broadcast.to(socket.room).emit(game_prefix + 'winner', {winner: winner});

						console.log('Room ' + socket.room + ': Game ended, ' + winner.winner + ' won');
					}

					if (game.moves >= 9) {
						const code = utils.generateHash(6);

						socket.emit(game_prefix + 'draw', {new_code: code});
						socket.broadcast.to(socket.room).emit(game_prefix + 'draw', {new_code: code});

						console.log('Room ' + socket.room + ': Game ended, draw');
					}
				}
			}
		});

		socket.on('disconnect', function () {
			if (!socket.room.startsWith(game_prefix)) {
				return;
			}
	
			if (socket.room in game_logic.games) {	
				const game = game_logic.games[socket.room];
				if (game.player1 == socket) {
					game.player1 = null;
					if (game.player2 != null) {
						game.player2.emit(game_prefix + 'stop');
					}
				} else if (game.player2 == socket) {
					game.player2 = null;
					if (game.player1 != null) {
						game.player1.emit(game_prefix + 'stop');
					}
				}
	
				if (game.player1 == null && game.player2 == null) {
					var index = rooms.indexOf(socket.room);
					if (index > -1) {
						rooms.splice(index, 1);
					}
	
					delete game_logic.games[socket.room];
	
					console.log('Room closed: ' + socket.room);
				}
			}
		});
	});
});