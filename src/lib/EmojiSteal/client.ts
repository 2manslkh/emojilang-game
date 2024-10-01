import { io, Socket } from 'socket.io-client';
import { writable } from 'svelte/store';

// Connect to the Socket.IO server
export const socket: Socket = io('http://localhost:5173', {
    transports: ['websocket', 'polling']
});

export const players = writable<Player[]>([]);
export const currentPlayer = writable<Player | null>(null);

interface Player {
    id: string;
    name: string;
    emoji: string;
}

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('gameState', (newPlayers: Player[]) => {
    console.log('Received game state:', newPlayers);
    players.set(newPlayers);
    currentPlayer.set(newPlayers.find(p => p.id === socket.id) || null);
});

export function joinGame(name: string) {
    console.log('Joining game with name:', name);
    socket.emit('join', name);
}

export function stealEmoji(targetId: string) {
    console.log('Stealing emoji from:', targetId);
    socket.emit('steal', targetId);
}

// Add error handling
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
});