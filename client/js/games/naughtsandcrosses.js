$(function(){
	const game_prefix = 'naughtsandcrosses:';

	var socket = io.connect(),

	player = {},

	your_turn = false,
	url = window.location.href.split('/'),
	room = game_prefix + url[url.length - 1],
	game_ended = false;

	var text = {
		'yt' : "Your turn",
		'nyt' : "Waiting for opponent",
		'popover_h2' : "Waiting for opponent",
		'popover_p' : "Give the url to a friend to play a game",
		'popover_h2_win' : "You won the game!",
		'popover_p_win' : "Go to this url to play again with the same opponent",
		'popover_h2_lose' : "You lost the game...",
		'popover_p_lose' : "Go to this url to play again with the same opponent",
		'popover_h2_draw' : "It's a draw...",
		'popover_p_draw' : "Go to this url to play again with the same opponent",
		'room_full' : "Room is full",
		'opponent_left' : "Opponent left",
	}

	init();

	socket.on(game_prefix + 'assign', function(data) {
		player.pid = data.pid;
		player.hash = data.hash;

		if (player.pid == "1") {
			player.opponentid = 2;

			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		} else {
			player.opponentid = 1;
			

		}
	});

	socket.on(game_prefix + 'winner', function(data) {
		game_ended = true;

		oc.removeClass('show');
		yc.removeClass('show');

		change_turn(false);

		for (var i = 0; i < 4; i++) {
			$('.buttons .button .button#btn_' + data.winner.winner_coins[i]).addClass('winner_button');
		}

		if (data.winner.winner == player.pid) {
			$('.popover h2').html(text.popover_h2_win);
			$('.popover p').html(text.popover_p_win);
		} else {
			$('.popover h2').html(text.popover_h2_lose);
			$('.popover p').html(text.popover_p_lose);
		}

		$('.popover input').val(window.location.href.substring(0, window.location.href.length - 6) + data.winner.new_code);
		
		setTimeout(function() {
			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		}, 2000);
	});

	socket.on(game_prefix + 'draw', function(data) {
		game_ended = true;

		change_turn(false);

		$('.status').html(text.popover_h2_draw);
		$('.popover h2').html(text.popover_h2_draw);
		$('.popover p').html(text.popover_p_draw);

		$('.popover input').val(window.location.href.substring(0, window.location.href.length - 6) + data.new_code);

		$('.underlay').removeClass('hidden');
		$('.popover').removeClass('hidden');
	});

	socket.on(game_prefix + 'start', function(data) {
		if (data == player.pid) {
			change_turn(true);

			$('.status').html(text.yt);
		} else {
			change_turn(false);

			$('.status').html(text.nyt);
		}

		$('.underlay').addClass('hidden');
		$('.popover').addClass('hidden');
	});

	socket.on(game_prefix + 'move_made', function(data) {
		make_move(data.box + 1, true);
		change_turn(true);
	});

	socket.on(game_prefix + 'stop', function(data) {
		if (!game_ended) {
			game_ended = true;

			$('.status').html(text.opponent_left);

			$('.popover h2').html(text.opponent_left);
			$('.popover p').html('');
			$('.popover input').val('');

			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		}
	});

	socket.on(game_prefix + 'full', function(data) {
		$('.status').html(text.room_full);

		$('.popover h2').html(text.room_full);
		$('.popover p').html('');
		$('.popover input').val('');

		$('.underlay').removeClass('hidden');
		$('.popover').removeClass('hidden');
	});

	$('.buttons > .button').click(function() {
		if (parseInt($(this).attr('data-in-button')) == 0) {
			if (your_turn) {
				var box = $(this).index() + 1;
				make_move(box);
				socket.emit(game_prefix + 'make_move', {box: box - 1, hash: player.hash});
				change_turn(false);
			}
		}
	});

	function make_move(box, other){
		if (!other) {
			other = false;
		}

		var button_elm = $('.buttons > .button#btn_' + box);
		var playerid = other ? player.opponentid : player.pid;
		button_elm.attr('data-in-button', playerid);

		button_elm.html(playerid == 1 ? "X" : "O");
	}

	function init() {
		socket.emit(game_prefix + 'join', {room: room});

		$('.popover input').val(window.location.href);
		$('.popover h2').html(text.popover_h2);
		$('.popover p').html(text.popover_p);
		$('.status').html('');

		scale_game();
	}

	function change_turn(yt) {
		if (yt) {
			your_turn = true;
			$('.status').html(text.yt);
		} else {
			your_turn = false;
			$('.status').html(text.nyt);
		}
	}

	function scale_game() {
		var htmlWidth = $('html').innerWidth();
		var scale = 1;
		if (htmlWidth < 600) {
			scale = htmlWidth / 600;
		}

		$(".game").css('-ms-transform', 'scale(' + scale + ')');
		$(".game").css('transform', 'scale(' + scale + ')');
	}
	
	$('.popover input').click(function() {
		$(this).select();
	});

	$(window).on('resize', function() {
		scale_game();
	});
});