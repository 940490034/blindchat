window.onload = function() {
	var chat = new client();
	chat.init();
};

var client = function() {
	this.socket = null;
};

client.prototype = {
	init: function() {
		var self = this;
		self.socket = io.connect();

		self.socket.on('connect', function() {
			document.getElementById('info').textContent = '请输入昵称！';
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});
		// 注册按钮
		document.getElementById('loginBtn').addEventListener('click', function() {
			var nickName = document.getElementById('nicknameInput').value;
			if (nickName.trim().length != 0) {
				self.socket.emit('login', nickName);
			} else {
				document.getElementById('nicknameInput').focus();
			}
		}, false);
		// 发送按钮
		document.getElementById('sendBtn').addEventListener('click', function() {
			var messageInput = document.getElementById('messageInput');
			var msg = messageInput.value;
			var color = document.getElementById('colorStyle').value;
			messageInput.value = '';
			messageInput.focus();
			if (msg.trim().length != 0) {
				self.socket.emit('postMsg', msg, color); //把消息发送到服务器
				self.displayNewMsg('自己', msg, color); //把自己的消息显示到自己的窗口中
			};
		}, false);
		// 图片按钮
		document.getElementById('sendImage').addEventListener('change', function() {
			if (this.files.length != 0) {
				var file = this.files[0];
				var reader = new FileReader();
				if (!reader) {
					self.displayNewMsg('系统消息', '你的破浏览器不支持fileReader', 'red');
					this.value = '';
					return;
				}
				reader.onload = function(e) {
					this.value = '';
					self.socket.emit('postImg', e.target.result);
					self.displayNewImg('自己', e.target.result);
				}
				reader.readAsDataURL(file);
			}
		}, false);

		this.initEmoji();
		document.getElementById('emoji').addEventListener('click', function(e) {
			var emojiWrap = document.getElementById('emojiWrapper');
			emojiWrap.style.display = 'block';
			e.stopPropagation();
		}, false);
		document.body.addEventListener('click', function(e) {
			var emojiWrap = document.getElementById('emojiWrapper');
			if (e.target != emojiWrap) {
				emojiWrap.style.display = 'none';
			}
		});

		document.getElementById('emojiWrapper').addEventListener('click', function(e) {
			var target = e.target;
			if (target.nodeName.toLowerCase() == 'img') {
				var msgInput = document.getElementById('messageInput');
				msgInput.focus();
				msgInput.value = msgInput.value + '[emoji:' + target.title + ']';
			}
		});

		// 接受 服务器返回 信息
		this.socket.on('nickExisted', function() {
			document.getElementById('info').textContent = '该昵称已存在！'; //显示昵称被占用的提示
		});

		this.socket.on('loginSuccess', function() {
			document.title = '欢迎 ' + document.getElementById('nicknameInput').value + ' 进入瞎聊';
			document.getElementById('loginWrapper').style.display = 'none'; //隐藏遮罩层显聊天界面
			document.getElementById('messageInput').focus(); //让消息输入框获得焦点
		});

		this.socket.on('system', function(nickName, userCount, type) {
			var msg = nickName + (type == 'login' ? ' 加入了' : ' 离开了') + '聊天室';
			self.displayNewMsg('系统消息', msg, 'red');
			document.getElementById('status').textContent = '当前 ' + userCount + ' 位用户' + ' 在线';
		});

		this.socket.on('newMsg', function(user, msg, color) {
			self.displayNewMsg(user, msg, color);
		});

		this.socket.on('newImg', function(user, img) {
			self.displayNewImg(user, img);
		});

	},

	displayNewMsg: function(user, msg, color) {
		var container = document.getElementById('historyMsg');
		var msgToDisplay = document.createElement('p');
		var date = new Date().toTimeString().substr(0, 8);
		var msg = this.displayEmoji(msg);

		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')</span>' + ': ' + msg;
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},

	displayNewImg: function(user, imgData, color) {
		var container = document.getElementById('historyMsg');
		var msgToDisplay = document.createElement('p');
		var date = new Date().toTimeString().substr(0, 8);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},

	initEmoji: function() {
		var container = document.getElementById('emojiWrapper');
		var docFragment = document.createDocumentFragment();
		for (var i = 69; i > 0; --i) {
			var emojiItem = document.createElement('img');
			emojiItem.src = '../emoji/' + i + '.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		}
		container.appendChild(docFragment);
	},

	displayEmoji: function(msg) {
		var match;
		var result = msg;
		var reg = /\[emoji:\d+\]/g;
		var emojiIndex;
		var totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while (match = reg.exec(msg)) {
			emojiIndex = match[0].slice(7, -1);
			if (emojiIndex > totalEmojiNum) {
				result = result.replace(match[0], '[X]');
			} else {
				result = result.replace(match[0], '<img class="emoji" src="../emoji/' + emojiIndex + '.gif" />');
			}
		}
		return result;
	}

}