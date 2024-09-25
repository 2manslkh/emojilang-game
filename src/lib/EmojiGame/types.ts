export interface Question {
    emojilang: string;
    answer: string;
    level: number;
}

export interface Level {
    name: string;
    description: string;
    questions: Question[];
}
