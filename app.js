//starts an express server
var express = require('express');
var app = express();
var serv = require('http').Server(app);

//if no query, default request is to index.html
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/Client/index.html');
	});

app.use('/Client',express.static(__dirname + '/Client'));

serv.listen(2000);


var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id) {
	var self = {
		x:250,
		y:250,
		id:id,
		number: Math.floor(10 * Math.random())
		}
		return self;

}

//loads and initializes socket.io, returns io object
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {

		SOCKET_LIST[socket.id] = socket;
		
		var player = Player(socket.id);
		PLAYER_LIST[socket.id] = player;
	
		console.log('socket connection');
		socket.on('disconnect', function() {
			delete SOCKET_LIST[socket.id];
			delete PLAYER_LIST[socket.id];
		});
});

//updates positions every 40ms
setInterval(function() {
	var pack = [];
	for (var i in PLAYER_LIST) {

		var player = PLAYER_LIST[i];
		player.x++;
		player.y++;
		pack.push({
			x:player.x,
			y:player.y,
			number: player.number
		});
	}
	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}


}, 1000/25);