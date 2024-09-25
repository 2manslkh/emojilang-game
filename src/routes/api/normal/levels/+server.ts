// src/routes/api/levels/+server.ts

import { json, type RequestHandler } from "@sveltejs/kit";
import { levels } from "$lib/EmojiGame";

export const GET: RequestHandler = async () => {
    return json(levels);
};