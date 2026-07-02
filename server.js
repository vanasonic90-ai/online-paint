const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Храним историю линий в виде массива объектов
let canvasHistory = []; 

io.on('connection', (socket) => {
    console.log('Пользователь подключился:', socket.id);
    
    // Сразу передаем всю историю нового участнику
    socket.emit('canvas_state', canvasHistory);

    socket.on('draw_line', (data) => {
        canvasHistory.push(data); // Запоминаем линию на сервере
        socket.broadcast.emit('draw_line', data);
    });

    socket.on('save_canvas', (clientHistory) => {
        // Синхронизируем базу данных линий
        if(clientHistory.length > canvasHistory.length) {
            canvasHistory = clientHistory;
        }
    });

    socket.on('request_canvas_state', () => {
        socket.emit('canvas_state', canvasHistory);
    });

    socket.on('clear_canvas', () => {
        canvasHistory = [];
        io.emit('clear_canvas');
    });

    socket.on('disconnect', () => {
        console.log('Пользователь отключился:', socket.id);
    });
});

const PORT = process.env.PORT || 3000; // Авто-порт под хостинги
server.listen(PORT, () => {
    console.log(`Сервер работает!`);
});
