const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Serwowanie plików graficznych (klienta)
app.use(express.static('public'));

let players = {}, food = [];
const MAP_SIZE = 5000;

// Fizyka 1:1 - Spawnowanie jedzenia
function spawnFood(n) {
    for(let i=0; i<n; i++) {
        food.push({
            id: Math.random(),
            x: Math.random() * MAP_SIZE,
            y: Math.random() * MAP_SIZE,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            mass: 1
        });
    }
}
spawnFood(500);

io.on('connection', (socket) => {
    socket.on('join', (nick) => {
        players[socket.id] = {
            name: nick || "Adrian",
            color: `hsl(${Math.random() * 360}, 80%, 50%)`,
            cells: [{ x: MAP_SIZE/2, y: MAP_SIZE/2, mass: 32, bX: 0, bY: 0 }],
            angle: 0
        };
        socket.emit('init', socket.id);
    });

    socket.on('move', angle => {
        if (players[socket.id]) players[socket.id].angle = angle;
    });

    socket.on('disconnect', () => delete players[socket.id]);
});

// Główna pętla gry - fizyka ruchu i zjadania
setInterval(() => {
    for (let id in players) {
        let p = players[id];
        p.cells.forEach(c => {
            // Prędkość Agar.io: 2.2 * mass^-0.439
            let speed = 2.2 * Math.pow(c.mass, -0.439) * 40;
            c.x += Math.cos(p.angle) * speed;
            c.y += Math.sin(p.angle) * speed;

            // Granice mapy
            c.x = Math.max(0, Math.min(MAP_SIZE, c.x));
            c.y = Math.max(0, Math.min(MAP_SIZE, c.y));

            // Zjadanie jedzenia
            food.forEach((f, index) => {
                let dist = Math.hypot(c.x - f.x, c.y - f.y);
                if (dist < Math.sqrt(c.mass * 100)) {
                    c.mass += f.mass;
                    food.splice(index, 1);
                    spawnFood(1);
                }
            });
        });
    }
    io.emit('update', { players, food });
}, 30);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`BetterBubble działa na porcie ${PORT}`));
