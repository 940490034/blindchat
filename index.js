var express = require('express') ;
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = [];
app.use(express.static('client'));

app.get('/', function(req, res) {
	res.send(__dirname + '/' + 'index.html');
});

io.on('connection', function(socket) {
	socket.on('login', function(nickName) {
		if (users.indexOf(nickName) > -1) {
			socket.emit('nickExisted');
		} else {
			socket.usersIndex = users.length;
			socket.nickName = nickName;
			users.push(nickName);
			socket.emit('loginSuccess');
			io.sockets.emit('system', nickName, users.length, 'login'); //向所有连接到服务器的客户端发送当前登陆用户的昵称 
		}
	});

	socket.on('postMsg', function(msg, color) {
		socket.broadcast.emit('newMsg', socket.nickName, msg, color);
	});

	socket.on('postImg', function(imgData) {
		socket.broadcast.emit('newImg', socket.nickName, imgData);
	});

	socket.on('disconnect', function() {
		users.splice(socket.usersIndex, 1);
		console.log(users);
		socket.broadcast.emit('system', socket.nickName, users.length, 'logout');
	});

});


http.listen(3000, function() {
	console.log('3000端口已开启');
});