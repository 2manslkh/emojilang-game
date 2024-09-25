// src/routes/api/levels/+server.ts

import { error, json, type RequestHandler } from "@sveltejs/kit";
import { levels } from "$lib/EmojiGame";

export const GET: RequestHandler = async ({ params }) => {
    const level = params.level;
    if (!level) {
        return error(400, "Level is required");
    }
    return json(levels[Number(level)]);
};