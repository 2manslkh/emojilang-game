import { PRIVATE_OPENAI_API_KEY } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { OpenAI } from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({ apiKey: PRIVATE_OPENAI_API_KEY });


const test = async () => {
    try {


        const CalendarEvent = z.object({
            name: z.string(),
            date: z.string(),
            participants: z.array(z.string()),
        });

        const response = await client.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: "Extract the event information." },
                { role: "user", content: "Alice and Bob are going to a science fair on Friday." },
            ],
            response_format: zodResponseFormat(CalendarEvent, "event"),
        });
        console.log("🚀 | test | response:", response)

        if (!response) {
            return error(500, 'No content in response');
        }

        return response;
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to evaluate translation');
    }
};

export const POST: RequestHandler = async () => {

    try {
        const result = await test();
        return json(result);
    } catch {
        return error(500, 'Failed to evaluate translation');
    }
};