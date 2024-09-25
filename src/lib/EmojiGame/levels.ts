import type { Level } from "./types";
import { cryptoQuestions, questions } from "./data";

export const levels: Record<number, Level> = {
    1: {
        name: "Single Nouns",
        description: "Translate single noun emojis.",
        questions: questions["1"],
    },
    2: {
        name: "Simple Verbs",
        description: "Translate single verb emojis.",
        questions: questions["2"],
    },
    3: {
        name: "Noun Phrases",
        description: "Translate noun phrases with modifiers.",
        questions: questions["3"],
    },
    4: {
        name: "Movies",
        description: "Guess the movie title from the emojis.",
        questions: questions["4"],
    },
    5: {
        name: "Sentences with Objects",
        description: "Translate sentences with objects.",
        questions: questions["5"],
    },
    6: {
        name: "Sentences with Modifiers",
        description: "Translate sentences with modifiers.",
        questions: questions["6"],
    },
    7: {
        name: "Questions",
        description: "Translate various types of questions.",
        questions: questions["7"],
    },
    8: {
        name: "Complex Sentences",
        description: "Translate complex sentences with conjunctions and passive voice.",
        questions: questions["8"],
    },
    9: {
        name: "Abstract Concepts",
        description: "Translate sentences with abstract ideas and metaphors.",
        questions: questions["9"],
    },
    10: {
        name: "Full Paragraphs",
        description: "Translate complete paragraphs in Emojilang.",
        questions: questions["10"],
    },
};

export const cryptoLevels: Record<number, Level> = {
    1: {
        name: "Basic",
        description: "Identify basic cryptocurrency terms and concepts.",
        questions: cryptoQuestions["1"],
    },
    2: {
        name: "Crypto Projects",
        description: "Guess popular cryptocurrency projects and platforms.",
        questions: cryptoQuestions["2"],
    },
    3: {
        name: "Crypto VCs",
        description: "Identify well-known venture capital firms in the crypto space.",
        questions: questions["3"],
    },
    4: {
        name: "Famous People",
        description: "Recognize influential figures in the cryptocurrency world.",
        questions: cryptoQuestions["4"],
    },
    5: {
        name: "Crypto Events",
        description: "Identify significant events and milestones in crypto history.",
        questions: cryptoQuestions["5"],
    },
    6: {
        name: "Crypto Concepts",
        description: "Understand fundamental concepts in cryptocurrency and blockchain.",
        questions: cryptoQuestions["6"],
    },
    7: {
        name: "Crypto Actions",
        description: "Interpret common actions and operations in the crypto ecosystem.",
        questions: cryptoQuestions["7"],
    },
    8: {
        name: "Crypto Concepts Part 2",
        description: "Explore advanced concepts and terminology in cryptocurrency.",
        questions: cryptoQuestions["8"],
    },
    9: {
        name: "Technical Concepts",
        description: "Decipher technical aspects of blockchain and cryptocurrency technology.",
        questions: cryptoQuestions["9"],
    },
    10: {
        name: "Trading Terms",
        description: "Understand common trading terms and strategies in the crypto market.",
        questions: cryptoQuestions["10"],
    },
};
