import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { setupSocketIO } from './src/lib/sockets';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'sveltekit-socket-io',
			configureServer(server) {
				setupSocketIO(server);
			},
		},
	],
});