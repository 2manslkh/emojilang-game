import type { RequestHandler } from '@sveltejs/kit';
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: "YOUR_PUSHER_APP_ID",
    key: "YOUR_PUSHER_APP_KEY",
    secret: "YOUR_PUSHER_SECRET",
    cluster: "YOUR_PUSHER_CLUSTER",
    useTLS: true
});

export const POST: RequestHandler = async ({ request }) => {
    const { name } = await request.json();
    // Here you would add the player to your game state
    // For simplicity, we're just triggering an event
    await pusher.trigger('game-channel', 'gameState', {
        players: [{ id: 'some-id', name, emoji: '😀' }]
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
};