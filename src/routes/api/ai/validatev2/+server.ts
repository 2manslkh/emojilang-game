import { PRIVATE_OPENAI_API_KEY } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { OpenAI } from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({ apiKey: PRIVATE_OPENAI_API_KEY });

interface EvaluationRequestV2 {
    correct_translation: string;
    user_translation: string;
}

interface EvaluationResponseV2 {
    score: number;
}

const EvaluationResponseV2Schema = z.object({
    score: z.number(),
});

const evaluate_translation_v2 = async (correct_translation: string, user_translation: string): Promise<EvaluationResponseV2> => {
    const system_prompt = `
You are an assistant that helps users translate Emojilang expressions into English and evaluates their translations.

Task:
1. Compare the correct translation to the user's translation.
2. Evaluate the user's translation for accuracy, grammar, and adherence to the Emojilang rules.
3. Provide a score between 0 and 100, where 100 means a perfect translation.
4. Always provide the correct translation as a separate field in the JSON object.
5. Output only a JSON object with the structure: {"score": xxx}, where xxx is the numerical score.

Important:
- Do not include any explanations or additional text.
- Only output the JSON object.

Example Output:
{"score": 90}
`;

    const prompt = `
Correct Translation:
${correct_translation}

User's Translation:
${user_translation}
`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0,
            response_format: zodResponseFormat(EvaluationResponseV2Schema, "data")
        });
        console.log("🚀 | constevaluate_translation_v2= | response:", response)


        const content = response?.choices[0]?.message?.content?.trim();
        console.log("🚀 | constevaluate_translation_v2= | content:", content)

        if (!content) {
            return error(500, 'No content in response');
        }

        const score_json = JSON.parse(content);
        return score_json;
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Failed to evaluate translation');
    }
};

export const POST: RequestHandler = async ({ request }) => {
    const { correct_translation, user_translation }: EvaluationRequestV2 = await request.json();

    try {
        const result = await evaluate_translation_v2(correct_translation, user_translation);
        return json(result);
    } catch {
        return error(500, 'Failed to evaluate translation');
    }
};