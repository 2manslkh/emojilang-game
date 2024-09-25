// src/routes/api/validate-answer/+server.ts

import { error, json, type RequestHandler } from "@sveltejs/kit";
import { questions } from "$lib/EmojiGame";

export const POST: RequestHandler = async ({ request }) => {
    const { emojilang, userAnswer } = await request.json();

    // Find the question based on the emojilang expression
    const question = questions.find((q) => q.emojilang === emojilang);

    if (!question) {
        return error(400, "Question not found");
    }

    const isCorrect =
        userAnswer.trim().toLowerCase() === question.answer.toLowerCase();

    return json({
        isCorrect,
        correctAnswer: question.answer,
    });
};
