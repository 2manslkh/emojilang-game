import { Server } from 'socket.io';
import type { ViteDevServer } from 'vite';

interface Player {
    id: string;
    name: string;
    emoji: string;
}

const players = new Map<string, Player>();
const emojis = ['😀', '😎', '🤠', '🤖', '👻', '🐱', '🐶', '🦄', '🍕', '🌈'];

export function setupSocketIO(server: ViteDevServer) {
    const io = new Server(server.httpServer!);

    io.on('connection', (socket) => {
        console.log('Client connected');

        socket.on('join', (name: string) => {
            console.log(`${name} joined the game`);
            const player: Player = {
                id: socket.id,
                name,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
            };
            players.set(socket.id, player);

            // Emit updated player list to all clients
            io.emit('gameState', Array.from(players.values()));
        });

        socket.on('steal', (targetId: string) => {
            console.log(`Steal attempt on ${targetId}`);
            const stealer = players.get(socket.id);
            const target = players.get(targetId);

            if (stealer && target) {
                const stolenEmoji = target.emoji;
                target.emoji = '❓';
                stealer.emoji = stolenEmoji;

                // Emit updated player list to all clients
                io.emit('gameState', Array.from(players.values()));
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
            players.delete(socket.id);
            // Emit updated player list to all clients
            io.emit('gameState', Array.from(players.values()));
        });
    });
}