import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

interface Player {
    id: string;
    name: string;
    emoji: string;
}

const players: Map<string, Player> = new Map();
const emojis = ['😀', '😎', '🤠', '🤖', '👻', '🐱', '🐶', '🦄', '🍕', '🌈'];

export function setupSocketIO(server: HttpServer) {
    const io = new Server(server);

    io.on('connection', (socket) => {

        socket.on('join', (name: string) => {
            const player: Player = {
                id: socket.id,
                name,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
            };
            players.set(socket.id, player);
            socket.emit('gameState', Array.from(players.values()));
            socket.broadcast.emit('playerJoined', player);
        });

        socket.on('steal', (targetId: string) => {
            const stealer = players.get(socket.id);
            const target = players.get(targetId);

            if (stealer && target) {
                const stolenEmoji = target.emoji;
                target.emoji = '❓';
                stealer.emoji = stolenEmoji;

                io.emit('gameState', Array.from(players.values()));
            }
        });

        socket.on('disconnect', () => {
            const player = players.get(socket.id);
            if (player) {
                players.delete(socket.id);
                socket.broadcast.emit('playerLeft', player.id);
            }
        });
    });
}