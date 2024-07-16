const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const mkdirp = require('mkdirp');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Specify the directory path and file name
const filePath = __dirname + '/public/index.html';

// Ensure the directory exists before attempting to write the file
mkdirp.sync(__dirname + '/public');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Chat App</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f0f0f0;
      margin: 0;
      padding: 0;
    }
    #messages {
      list-style-type: none;
      margin: 0;
      padding: 0;
    }
    #messages li {
      padding: 10px;
      margin-bottom: 10px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    #message-form {
      display: flex;
      margin-top: 20px;
    }
    #message-form input {
      flex: 1;
      padding: 10px;
      font-size: 16px;
      border: 1px solid #cccccc;
      border-radius: 4px;
      margin-right: 10px;
    }
    #message-form button {
      padding: 10px 20px;
      font-size: 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    #login, #chat {
      width: 100%;
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    #login-form, #message-form {
      display: flex;
      align-items: center;
    }
    #login-form input, #login-form button,
    #message-form input, #message-form button {
      margin-right: 10px;
    }
  </style>
</head>
<body>
  <div id="login">
    <form id="login-form">
      <input id="username-input" autocomplete="off" placeholder="Enter your username..." style="font-size: 16px;">
      <button>Login</button>
    </form>
  </div>

  <div id="chat" style="display: none;">
    <ul id="messages"></ul>
    <form id="message-form">
      <input id="message-input" autocomplete="off" placeholder="Type a message..." style="font-size: 16px;">
      <button>Send</button>
    </form>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    var socket = io();
    var username = '';

    var loginForm = document.getElementById('login-form');
    var usernameInput = document.getElementById('username-input');
    var chatDiv = document.getElementById('chat');

    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      username = usernameInput.value.trim();
      if (username) {
        socket.emit('new user', username);
        loginForm.reset();
        document.getElementById('login').style.display = 'none';
        chatDiv.style.display = 'block';
      }
    });

    var form = document.getElementById('message-form');
    var input = document.getElementById('message-input');
    var messages = document.getElementById('messages');

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (input.value) {
        socket.emit('chat message', username + ': ' + input.value);
        input.value = '';
      }
    });

    socket.on('chat message', function(msg) {
      var item = document.createElement('li');
      item.textContent = msg;
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('user joined', function(username) {
      var item = document.createElement('li');
      item.textContent = username + ' joined the chat';
      item.style.fontStyle = 'italic';
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on('user left', function(username) {
      var item = document.createElement('li');
      item.textContent = username + ' left the chat';
      item.style.fontStyle = 'italic';
      messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });
  </script>
</body>
</html>

`;

// Write the HTML content to a file
fs.writeFileSync(filePath, htmlContent);

let users = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('new user', (username) => {
    users[socket.id] = username;
    io.emit('user joined', username);
  });
  
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      io.emit('user left', users[socket.id]);
      delete users[socket.id];
    }
    console.log('A user disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(filePath);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
