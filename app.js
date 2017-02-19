//starts an express server
var express = require('express');
var app = express();
var serv = require('http').Server(app);

//if no query, default request is to index.html
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/Client/index.html');
	});

app.use('/Client',express.static(__dirname + '/Client'));

serv.listen(2001);


var SOCKET_LIST = {};
var PLAYER_LIST = {};

//******Player********************
var Player = function(id) {
	var self = {
		x:250,
		y:250,
		id:id,
		rotation:0,
		maxSpeed: 5,
		speed: 6,
		attack_timer: 5,
		name: '',
		pressingLeft: false,
		pressingRight: false,
		pressingUp: false,
		pressingDown: false,
		pressingSpace: false
		}
	self.updatePosition = function() {
		if(self.pressingLeft) {
			self.rotation-= 10;
		}
		if(self.pressingRight)
			self.rotation+= 10;
		if(self.pressingUp) {
			self.x -= self.speed * Math.cos(self.rotation * Math.PI/180);
			self.y -= self.speed * Math.sin(self.rotation * Math.PI/180);
		}
		if(self.pressingDown) {

			self.x += self.speed * Math.cos(self.rotation * Math.PI/180);
			self.y += self.speed * Math.sin(self.rotation * Math.PI/180);		
		}
		if (self.rotation >= 360)
			self.rotation = 0;
		if(self.pressingSpace && self.attack_timer === 0) {
			//if(Bullet.list.length < 10)
				Bullet(self.x, self.y, self.rotation);
			self.attack_timer  = 5;
		}
		if (self.attack_timer > 0)
			self.attack_timer--;

		if(self.x < 0)
			self.x = 0;
		if(self.x > 1150)
			self.x = 1150;
		if(self.y < 0)
			self.y = 0;
		if (self.y > 550)
			self.y = 550;
		
	
	
	}
		return self;

}
Player.update = function() {
	var pack = [];
	for (var i in PLAYER_LIST) {

		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			speed: player.speed,
			rotation: player.rotation,
			name: player.name
		});
	}
	return pack;
}
//*****************Bullet*******************
var Bullet = function(x, y, angle) {
	var self = {
		x:x,
		y:y,
		angle:angle,
		x_speed:0,
		y_speed:0,
		timer:0,
		id:0
	}
	self.x_speed = -15 * Math.cos(angle * Math.PI/180);
	self.y_speed = -15* Math.sin(angle * Math.PI/180);
	self.id = Math.random();


	

	self.update = function() {
		self.x += self.x_speed;
		self.y += self.y_speed;
		self.timer++;
		if(self.timer > 100)
			delete Bullet.list[self.id];
		
	}
	
	Bullet.list[self.id] = self;
	return self;
}

Bullet.update = function() {
	var pack = [];
	for (var b in Bullet.list) {
		var bullet = Bullet.list[b];
		bullet.update();
		pack.push({
			x:bullet.x,
			y:bullet.y
		});
		
	
	}
	return pack;
}
Bullet.list = {};

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
		
		socket.on('Name', function(data) {
			player.name = data.Name;
		});
		
		socket.on('keypress', function(data) {
			if(data.inputId === 'left') {
				player.pressingLeft = data.state;
			}
			else if(data.inputId === 'right')
				player.pressingRight = data.state;
			else if(data.inputId === 'up')
				player.pressingUp = data.state;
			else if(data.inputId === 'down')
				player.pressingDown = data.state;
			else if (data.inputId === 'space')
				player.pressingSpace = data.state;
		
		
		});
});

//updates positions every 40ms
setInterval(function() {
	var pack = {
		player: Player.update(),
		bullet: Bullet.update()
	}

	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		socket.emit('newPositions', pack);
	}


}, 40);