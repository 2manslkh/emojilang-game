import type { Level, Question } from './types';

export class EmojilangGame {
    levels: Record<number, Level> = {};
    currentQuestion: Question | null = null;
    score: number = 0;
    currentLevel: number = 1;
    correctAnswersInLevel: number = 0;

    constructor() { }

    async fetchLevels(): Promise<void> {
        const response = await fetch('/api/normal/levels');
        this.levels = await response.json();
    }

    async fetchCryptoLevels(): Promise<void> {
        const response = await fetch('/api/crypto/levels');
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

    resetCorrectAnswersInLevel(): void {
        this.correctAnswersInLevel = 0;
    }

    getRandomQuestion(): Question {
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
        correct: boolean;
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
            correct: result.score >= 80,
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

import { writable } from 'svelte/store';

export class EmojilangRushGame extends EmojilangGame {
    timeLimit: number = 180;
    private timer: NodeJS.Timeout | null = null;
    private startTime: number | null = null;

    timeRemaining = writable(this.timeLimit);
    gameActive = writable(false);

    constructor() {
        super();
    }

    startGame(): Question {
        this.score = 0;
        this.currentLevel = 1;
        this.correctAnswersInLevel = 0;
        this.startTime = Date.now();
        this.gameActive.set(true);
        this.startTimer();
        return this.nextQuestion();
    }

    getTimeLimit(): number {
        return this.timeLimit;
    }

    private startTimer() {
        this.timer = setInterval(() => {
            if (this.startTime) {
                const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
                const remaining = Math.max(0, this.timeLimit - elapsedTime);
                this.timeRemaining.set(remaining);

                if (remaining === 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    endGame() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.gameActive.set(false);
    }

    async submitTranslation(userTranslation: string): Promise<{
        feedback: string;
        score: number;
        currentLevel: number;
        correctAnswersInLevel: number;
        gameCompleted: boolean;
        correct: boolean;
        timeRemaining: number;
    }> {
        const result = await super.submitTranslation(userTranslation);
        const timeRemaining = this.getTimeRemaining();

        if (timeRemaining <= 0) {
            this.endGame();
        }

        return {
            ...result,
            timeRemaining,
        };
    }

    getTimeRemaining(): number {
        if (this.startTime) {
            const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
            return Math.max(0, this.timeLimit - elapsedTime);
        }
        return this.timeLimit;
    }

    getCurrentQuestion(): Question {
        if (!this.currentQuestion) {
            this.currentQuestion = this.getRandomQuestion();
        }
        return this.currentQuestion;
    }
}
