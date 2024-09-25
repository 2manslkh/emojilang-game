import type { Level } from "./types";
import { questions } from "./data";

export const levels: Record<number, Level> = {
    1: {
        name: "Single Nouns",
        description: "Translate single noun emojis.",
        questions: questions.filter(q => q.level === 1),
    },
    2: {
        name: "Simple Verbs",
        description: "Translate single verb emojis.",
        questions: questions.filter(q => q.level === 2),
    },
    3: {
        name: "Noun Phrases",
        description: "Translate noun phrases with modifiers.",
        questions: questions.filter(q => q.level === 3),
    },
    4: {
        name: "Movies",
        description: "Guess the movie title from the emojis.",
        questions: questions.filter(q => q.level === 4),
    },
    5: {
        name: "Crypto",
        description: "Guess the crypto words from the emojis.",
        questions: questions.filter(q => q.level === 5),
    },
    6: {
        name: "Crypto Part 2",
        description: "Guess the crypto words from the emojis.",
        questions: questions.filter(q => q.level === 6),
    },
    7: {
        name: "Questions",
        description: "Translate various types of questions.",
        questions: questions.filter(q => q.level === 7),
    },
    8: {
        name: "Complex Sentences",
        description: "Translate complex sentences with conjunctions and passive voice.",
        questions: questions.filter(q => q.level === 8),
    },
    9: {
        name: "Abstract Concepts",
        description: "Translate sentences with abstract ideas and metaphors.",
        questions: questions.filter(q => q.level === 9),
    },
    10: {
        name: "Full Paragraphs",
        description: "Translate complete paragraphs in Emojilang.",
        questions: questions.filter(q => q.level === 10),
    },
};