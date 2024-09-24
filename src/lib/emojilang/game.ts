import type { Level, Question } from './types';

export class EmojilangGame {
    private levels: Record<number, Level> = {};
    private currentQuestion: Question | null = null;
    private score: number = 0;
    private currentLevel: number = 1;
    private correctAnswersInLevel: number = 0;

    constructor() { }

    async fetchLevels(): Promise<void> {
        const response = await fetch('/api/levels');
        this.levels = await response.json();
    }

    getCurrentLevelName(): string {
        return this.levels[this.currentLevel].name;
    }

    getCurrentLevel(): number {
        return this.currentLevel;
    }

    getScore(): number {
        return this.score;
    }

    getCorrectAnswersInLevel(): number {
        return this.correctAnswersInLevel;
    }

    private getRandomQuestion(): Question {
        const index = Math.floor(Math.random() * this.levels[this.currentLevel].questions.length);
        return this.levels[this.currentLevel].questions[index];
    }

    startGame(): Question {
        this.score = 0;
        this.currentLevel = 1;
        this.correctAnswersInLevel = 0;
        return this.nextQuestion();
    }

    nextQuestion(): Question {
        this.currentQuestion = this.getRandomQuestion();
        return this.currentQuestion;
    }

    async submitTranslation(userTranslation: string): Promise<{
        feedback: string;
        score: number;
        currentLevel: number;
        correctAnswersInLevel: number;
        gameCompleted: boolean;
    }> {
        const response = await fetch('/api/ai/validatev2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                correct_translation: this.currentQuestion?.answer,
                emojilang_expression: this.currentQuestion?.emojilang,
                user_translation: userTranslation
            })
        });

        const result = await response.json();
        let feedback = '';
        let gameCompleted = false;

        if (result.score >= 80) {
            this.score += 10;
            this.correctAnswersInLevel++;
            feedback = `Correct! +10 points. Accuracy: ${result.score}%`;
            this.levels[this.currentLevel].questions = this.levels[this.currentLevel].questions.filter(
                (q) => q.emojilang !== this.currentQuestion?.emojilang
            );

            if (this.correctAnswersInLevel === 3) {
                this.currentLevel++;
                this.correctAnswersInLevel = 0;
                if (this.currentLevel <= 10) {
                    feedback += ` Congratulations! You've advanced to level ${this.currentLevel}!`;
                } else {
                    feedback = 'Congratulations! You completed all levels!';
                    gameCompleted = true;
                }
            }
        } else {
            feedback = `Incorrect. The correct translation is: "${this.currentQuestion?.answer}". Accuracy: ${result.score}%`;
        }


        return {
            feedback,
            score: this.score,
            currentLevel: this.currentLevel,
            correctAnswersInLevel: this.correctAnswersInLevel,
            gameCompleted
        };
    }

    getCurrentQuestion(): Question | null {
        return this.currentQuestion;
    }

    getLevels(): Record<number, Level> {
        return this.levels;
    }
}
