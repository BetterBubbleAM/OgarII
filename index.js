const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// To sprawi, że serwer nie będzie szukał starych plików OgarII
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

let players = {}, food = [];
const MAP_SIZE = 5000;

function spawnFood(n) {
    for(let i=0; i<n; i++) food.push({
        id: Math.random(), x: Math.random()*MAP_SIZE, y: Math.random()*MAP_SIZE, 
        color: `hsl(${Math.random()*360},100%,50%)`, mass: 1
    });
}
spawnFood(600);

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            name: nick || "Adrian",
            color: `hsl(${Math.random()*360},80%,50%)`,
            cells: [{ x: MAP_SIZE/2, y: MAP_SIZE/2, mass: 32, bX: 0, bY: 0 }],
            angle: 0
        };
        socket.emit('init', socket.id);
    });
    socket.on('move', a => { if(players[socket.id]) players[socket.id].angle = a; });
    socket.on('disconnect', () => delete players[socket.id]);
});

setInterval(() => {
    for (let id in players) {
        let p = players[id];
        p.cells.forEach(c => {
            let speed = 2.2 * Math.pow(c.mass, -0.439) * 45;
            c.x += Math.cos(p.angle) * speed;
            c.y += Math.sin(p.angle) * speed;
            c.x = Math.max(0, Math.min(MAP_SIZE, c.x));
            c.y = Math.max(0, Math.min(MAP_SIZE, c.y));
            food.forEach((f, i) => {
                if(Math.hypot(c.x-f.x, c.y-f.y) < Math.sqrt(c.mass*100)) {
                    c.mass += f.mass; food.splice(i, 1); spawnFood(1);
                }
            });
        });
    }
    io.emit('update', { players, food });
}, 30);

http.listen(process.env.PORT || 3000, () => console.log('BetterBubble LIVE!'));
