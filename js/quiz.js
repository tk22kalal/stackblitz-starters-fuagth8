import { generateQuestion } from './questionGenerator.js';
import { fetchFromAPI } from './api.js';
import { fetchExplanationImage } from './explanationImageService.js';

export class Quiz {
    constructor() {
        this.currentQuestion = null;
        this.score = 0;
        this.timer = null;
        this.timeLimit = 0;
        this.questionLimit = 0;
        this.questionsAnswered = 0;
        this.wrongAnswers = 0;
        this.difficulty = '';
    }

    async generateQuestion(subject) {
        if (this.questionLimit && this.questionsAnswered >= this.questionLimit) {
            return null;
        }

        return await generateQuestion(subject, this.difficulty);
    }

    async getExplanation(question, options, correctIndex) {
        const prompt = `
        For this ${this.difficulty.toLowerCase()} level medical question and its options:
        Question: "${question}"
        Options: ${options.map((opt, i) => `${i + 1}. ${opt}`).join(', ')}
        Correct Answer: ${options[correctIndex]}

        Please provide a point-wise explanation in this exact format:
        CORRECT ANSWER (${options[correctIndex]}):
        • Point 1 about why it's correct
        • Point 2 about why it's correct

        WHY OTHER OPTIONS ARE INCORRECT:
        ${options.map((opt, i) => i !== correctIndex ? `${opt}:
        • Point 1 why it's wrong
        • Point 2 why it's wrong` : '').filter(Boolean).join('\n\n')}

        Also provide a brief description of a medical diagram or image that would help explain this concept.
        IMAGE DESCRIPTION:
        `;

        try {
            const explanation = await fetchFromAPI(prompt);
            const parts = explanation.split('IMAGE DESCRIPTION:');
            const textExplanation = parts[0].trim();
            const imageDescription = parts[1]?.trim();

            let imageUrl = null;
            if (imageDescription) {
                imageUrl = await fetchExplanationImage(imageDescription);
            }

            return {
                text: textExplanation,
                imageUrl: imageUrl
            };
        } catch (error) {
            return {
                text: 'Failed to load explanation.',
                imageUrl: null
            };
        }
    }

    async getLearningObjectives(question, options, correctIndex) {
        const prompt = `
        For this ${this.difficulty.toLowerCase()} level medical question:
        Question: "${question}"
        Correct Answer: ${options[correctIndex]}

        Create concise learning objectives that include:
        1. Key points to remember (2-3 bullet points)
        2. Any relevant formulas or equations
        3. A small table if applicable
        4. A brief flowchart or mindmap description if relevant
        5. One flashcard-style quick fact

        Format the response in HTML with appropriate tags (<ul>, <table>, etc.).
        Also suggest a medical diagram or illustration that would help reinforce these concepts.
        IMAGE DESCRIPTION:
        `;

        try {
            const response = await fetchFromAPI(prompt);
            const parts = response.split('IMAGE DESCRIPTION:');
            const content = parts[0].trim();
            const imageDescription = parts[1]?.trim();

            let imageUrl = null;
            if (imageDescription) {
                imageUrl = await fetchExplanationImage(imageDescription);
            }

            return {
                content: content,
                imageUrl: imageUrl
            };
        } catch (error) {
            return {
                content: '<p>Failed to load learning objectives.</p>',
                imageUrl: null
            };
        }
    }

    async askDoubt(doubt, question) {
        const prompt = `
        Regarding this ${this.difficulty.toLowerCase()} level medical question:
        "${question}"
        
        User's doubt: "${doubt}"
        
        Please provide a clear, detailed explanation addressing this specific doubt in the context of the question.
        Focus on medical accuracy and explain in a way that's helpful for medical students.
        
        Also suggest if a medical diagram or image would be helpful, and if so, describe what it should show.
        IMAGE DESCRIPTION:
        `;

        try {
            const response = await fetchFromAPI(prompt);
            const parts = response.split('IMAGE DESCRIPTION:');
            const textAnswer = parts[0].trim();
            const imageDescription = parts[1]?.trim();

            let imageUrl = null;
            if (imageDescription) {
                imageUrl = await fetchExplanationImage(imageDescription);
            }

            return {
                text: textAnswer,
                imageUrl: imageUrl
            };
        } catch (error) {
            return {
                text: 'Failed to get answer. Please try again.',
                imageUrl: null
            };
        }
    }

    getResults() {
        return {
            total: this.questionsAnswered,
            correct: this.score,
            wrong: this.wrongAnswers,
            percentage: this.questionsAnswered > 0 
                ? Math.round((this.score / this.questionsAnswered) * 100) 
                : 0
        };
    }
}