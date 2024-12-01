import { fetchFromAPI } from './api.js';
import { fetchImageForQuestion } from './imageService.js';

export async function generateQuestion(subject, difficulty) {
    const shouldIncludeImage = Math.random() < 0.4; // 40% chance for image questions
    
    const difficultyContext = getDifficultyContext(difficulty);
    const prompt = `Generate a ${difficulty.toLowerCase()} level ${shouldIncludeImage ? 'image-based' : ''} multiple choice question about ${subject}. ${difficultyContext}
        ${shouldIncludeImage ? 'Include a brief description of the medical image that should accompany this question.' : ''}
        Format the response exactly as follows:
        {
            "question": "The question text here",
            ${shouldIncludeImage ? '"imageDescription": "Description of the medical image needed",' : ''}
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctIndex": correct_option_index_here
        }`;

    try {
        const response = await fetchFromAPI(prompt);
        const questionData = JSON.parse(response);

        if (shouldIncludeImage && questionData.imageDescription) {
            const imageUrl = await fetchImageForQuestion(
                `medical ${questionData.imageDescription} ${subject}`
            );
            if (imageUrl) {
                questionData.imageUrl = imageUrl;
            }
        }

        return questionData;
    } catch (error) {
        console.error('Question Generation Error:', error);
        return {
            question: 'Failed to load question. Please try again.',
            options: ['Error', 'Error', 'Error', 'Error'],
            correctIndex: 0
        };
    }
}

function getDifficultyContext(difficulty) {
    switch (difficulty) {
        case 'Easy':
            return 'Base the question on standard textbooks like BD Chaurasia, Guyton, Harper, etc.';
        case 'Medium':
            return 'Make it a NEET PG level question covering both clinical and non-clinical topics.';
        case 'Hard':
            return 'Make it an advanced NEET PG or INICET level clinical question.';
        default:
            return '';
    }
}