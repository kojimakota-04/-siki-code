const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // スマホからの指揮データを受信
    socket.on('conduct-command', (data) => {
        // PCへ転送
        socket.broadcast.emit('update-playback', data);
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});