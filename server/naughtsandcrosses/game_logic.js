const utils = require('../utils');

module.exports = {
	games : {},

	make_move : function(room, box, pid) {
		var board = this.games[room].board;

		if (board[box] == 0) {
			board[box] = pid;
			return true;
		}

		return false;
	},

	check_for_win : function(board) {
		var found = 0,
		winner_buttons = [],
		winner = false,
		data = {},
		person = 0;

		if (winner) {
			data.winner = winner;
			data.winner_buttons = winner_buttons;
			data.new_code = utils.generateHash(6);
			return data;
		}
		
		return false;
	}
}