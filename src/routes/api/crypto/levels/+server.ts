
import { json, type RequestHandler } from "@sveltejs/kit";
import { cryptoLevels } from "$lib/EmojiGame";

export const GET: RequestHandler = async () => {
    return json(cryptoLevels);
};