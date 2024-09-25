// src/routes/api/levels/[level]/questions/+server.ts

import { error, json, type RequestHandler } from "@sveltejs/kit";
import { questions } from "$lib/EmojiGame";

export const GET: RequestHandler = async ({ params }) => {

    if (!params.level) {
        return error(400, "Level is required");
    }

    const levelNumber = parseInt(params.level);
    const levelQuestions = questions.filter(
        (q) => q.level === levelNumber
    );

    return json(levelQuestions);
};