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
        name: "Basic Terms",
        description: "Identify basic cryptocurrency terms and concepts.",
        questions: cryptoQuestions["1"],
    },
    2: {
        name: "Blockchain Terms",
        description: "Identify blockchain terms and concepts.",
        questions: cryptoQuestions["2"],
    },
    3: {
        name: "Crypto Concepts",
        description: "Understand fundamental concepts in cryptocurrency and blockchain.",
        questions: cryptoQuestions["3"],
    },
    4: {
        name: "Crypto Wallets and Terms",
        description: "Identify different types of crypto wallets and related terms.",
        questions: cryptoQuestions["4"],
    },
    5: {
        name: "Advanced Crypto Terms",
        description: "Recognize advanced cryptocurrency and blockchain terms.",
        questions: cryptoQuestions["5"],
    },
    6: {
        name: "Crypto Economics",
        description: "Understand economic concepts in the cryptocurrency ecosystem.",
        questions: cryptoQuestions["6"],
    },
    7: {
        name: "Advanced Blockchain Concepts",
        description: "Identify advanced blockchain technologies and concepts.",
        questions: cryptoQuestions["7"],
    },
    8: {
        name: "Blockchain Security",
        description: "Understand security concepts and network types in blockchain.",
        questions: cryptoQuestions["8"],
    },
    9: {
        name: "Technical Blockchain Terms",
        description: "Identify technical blockchain terms and concepts.",
        questions: cryptoQuestions["9"],
    },
    10: {
        name: "Crypto Trading Terms",
        description: "Understand common trading terms and concepts in the crypto market.",
        questions: cryptoQuestions["10"],
    },
    11: {
        name: "Crypto VC Firms (Part 1)",
        description: "Identify well-known venture capital firms in the crypto space.",
        questions: cryptoQuestions["11"],
    },
    12: {
        name: "Crypto VC Firms (Part 2)",
        description: "Identify more venture capital firms in the crypto space.",
        questions: cryptoQuestions["12"],
    },
    13: {
        name: "Famous People in Crypto",
        description: "Recognize influential figures in the cryptocurrency world.",
        questions: cryptoQuestions["13"],
    },

};