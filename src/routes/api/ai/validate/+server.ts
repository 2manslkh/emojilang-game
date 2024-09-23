import { PRIVATE_OPENAI_API_KEY } from '$env/static/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { OpenAI } from 'openai';

const client = new OpenAI({ apiKey: PRIVATE_OPENAI_API_KEY });

const system_prompt = `
You are an assistant that evaluates translations of Emojilang expressions into English. Emojilang uses emojis as words with a Subject + Verb + Object structure. Tense is indicated by suffixes: Past (⏳), Present (🕒 or no marker), Future (📅). Pronouns include 👤 (I), 👉 (you), 👨 (he), 👩 (she), 🧑 (they singular), 👥 (we). Plurals are formed by adding ➕ or repeating the emoji.
`;

interface EvaluationRequest {
    emojilang_expression: string;
    user_translation: string;
}

interface EvaluationResponse {
    score: number;
    correct_translation: string;
}

const evaluate_translation = async (emojilang_expression: string, user_translation: string): Promise<EvaluationResponse> => {
    const prompt = `
User's Emojilang Expression:
${emojilang_expression}

User's Translation:
${user_translation}

Task:
1. Translate the Emojilang expression into English according to the Emojilang rules.
2. Compare the correct translation to the user's translation.
3. Evaluate the user's translation for accuracy, grammar, and adherence to the Emojilang rules.
4. Provide a score between 0 and 100, where 100 means a perfect translation.
5. Always provide the correct translation as a separate field in the JSON object.
6. Output only a JSON object with the structure: {"score": xxx, "correct_translation": "yyy"}, where xxx is the numerical score and the yyy is the correct translation.

Important:
- Do not include any explanations or additional text.
- Only output the JSON object.

Example Output:
{"score": 90, "correct_translation": "The cat is sleeping."}
`;

    try {
        const response = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: prompt }
            ],
            temperature: 0
        });


        const content = response?.choices[0]?.message?.content?.trim();

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
    const { emojilang_expression, user_translation }: EvaluationRequest = await request.json();

    try {
        const result = await evaluate_translation(emojilang_expression, user_translation);
        return json(result);
    } catch {
        return error(500, 'Failed to evaluate translation');
    }
};