export interface Question {
    emojilang: string;
    answer: string;
    level: number;
}

export interface Level {
    number: number;
    name: string;
    description: string;
    questions: Question[];
}
