import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

// ★ここは何も書かなくてOKです（tsconfigのおかげで __dirname が復活します）

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// これでエラーが出なくなります
app.use(express.static(path.join(__dirname, 'public')));

// データ型の定義
interface ConductCommand {
    rate: number;
    volume: number;
}

io.on('connection', (socket: Socket) => {
    console.log('User connected: ' + socket.id);

    socket.on('conduct-command', (data: ConductCommand) => {
        socket.broadcast.emit('update-playback', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});