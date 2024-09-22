import type { Level } from "$lib/emojilang/types";
import { writable } from "svelte/store";

export const currentLevel = writable<Level | null>(null);
export const currentQuestionIndex = writable<number>(0);
export const score = writable<number>(0);