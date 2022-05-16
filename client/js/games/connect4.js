$(function(){
	const game_prefix = 'connect4:';

	var socket = io.connect(),

	player = {},

	yc = $('.your_color'),
	oc = $('.opponent_color'),

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
			yc.addClass('red');
			oc.addClass('yellow');

			player.color = 'red';
			player.oponend = 'yellow';

			$('.underlay').removeClass('hidden');
			$('.popover').removeClass('hidden');
		} else {
			yc.addClass('yellow');
			oc.addClass('red');

			player.color = 'yellow';
			player.oponend = 'red';
		}
	});

	socket.on(game_prefix + 'winner', function(data) {
		game_ended = true;

		oc.removeClass('show');
		yc.removeClass('show');

		change_turn(false);

		for (var i = 0; i < 4; i++) {
			$('.cols .col .coin#coin_' + data.winner.winner_coins[i]).addClass('winner_coin');
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

		oc.removeClass('show');
		yc.removeClass('show');

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

			yc.addClass('show');
		} else {
			change_turn(false);

			oc.addClass('show');
		}

		$('.underlay').addClass('hidden');
		$('.popover').addClass('hidden');
	});

	socket.on(game_prefix + 'move_made', function(data) {
		make_move(data.col + 1, true);
		change_turn(true);

		yc.addClass('show');
		oc.removeClass('show');
	});

	socket.on(game_prefix + 'opponent_move', function(data) {
		if (!your_turn) {
			oc.css('left', parseInt(data.col) * 100);
		}
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

	$('.cols > .col').mouseenter(function() {
		if (your_turn) {
			yc.css('left', $(this).index() * 100);
			socket.emit(game_prefix + 'my_move', {col: $(this).index()});
		}
	});

	$('.cols > .col').click(function() {
		if (parseInt($(this).attr('data-in-col')) < 6) {
			if (your_turn) {
				var col = $(this).index() + 1;
				make_move(col);
				socket.emit(game_prefix + 'makeMove', {col: col - 1, hash: player.hash});
				change_turn(false);
				yc.removeClass('show');
				oc.addClass('show');
			}
		}
	});

	function make_move(col, other){
		if(!other) {
			other = false;
		}

		var col_elm = $('.cols > .col#col_' + col);
		var current_in_col = parseInt(col_elm.attr('data-in-col'));
		col_elm.attr('data-in-col', current_in_col + 1);

		var color = (other) ? player.oponend : player.color;
		var new_coin = $('<div class="coin ' + color + '" id="coin_' + (5 - current_in_col) + '' + (col - 1) + '"></div>');

		col_elm.append(new_coin);
		new_coin.animate({
			top : 100 * (4 - current_in_col + 1),
		}, 400);
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
		if (htmlWidth < 700) {
			scale = htmlWidth / 700;
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