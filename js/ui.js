import { Quiz } from './quiz.js';
import { SUBJECTS, DIFFICULTY_LEVELS } from './config.js';

export class QuizUI {
    constructor() {
        this.quiz = new Quiz();
        this.initializeElements();
        this.setupEventListeners();
        this.populateSubjects();
    }

    initializeElements() {
        // Setup container elements
        this.elements = {
            setupContainer: document.getElementById('setup-container'),
            subjectSelect: document.getElementById('subject-select'),
            subtopicSelect: document.getElementById('subtopic-select'),
            difficultySelect: document.getElementById('difficulty-select'),
            questionsSelect: document.getElementById('questions-select'),
            timeSelect: document.getElementById('time-select'),
            startQuizBtn: document.getElementById('start-quiz-btn'),
            difficultyInfo: document.getElementById('difficulty-info'),
            
            // Quiz container elements
            quizContainer: document.getElementById('quiz-container'),
            quizContent: document.getElementById('quiz-content'),
            timer: document.getElementById('timer'),
            currentQuestion: document.getElementById('current-question'),
            totalQuestions: document.getElementById('total-questions'),
            nextBtnContainer: document.getElementById('next-button-container'),
            nextBtn: document.getElementById('next-btn'),
            
            // Score elements
            scoreContainer: document.getElementById('score-container'),
            totalAttempted: document.getElementById('total-attempted'),
            correctAnswers: document.getElementById('correct-answers'),
            wrongAnswers: document.getElementById('wrong-answers'),
            scorePercentage: document.getElementById('score-percentage'),
            restartBtn: document.getElementById('restart-btn')
        };
    }

    setupEventListeners() {
        // Setup form event listeners
        this.elements.subjectSelect.addEventListener('change', () => this.handleSubjectChange());
        this.elements.difficultySelect.addEventListener('change', () => this.handleDifficultyChange());
        this.elements.startQuizBtn.addEventListener('click', () => this.startQuiz());
        
        // Quiz navigation event listeners
        this.elements.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.elements.restartBtn.addEventListener('click', () => this.restartQuiz());
    }

    populateSubjects() {
        this.elements.subjectSelect.innerHTML = '<option value="">Choose a subject...</option>';
        Object.keys(SUBJECTS).forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            this.elements.subjectSelect.appendChild(option);
        });
    }

    handleSubjectChange() {
        const subject = this.elements.subjectSelect.value;
        this.elements.subtopicSelect.innerHTML = '<option value="">Choose a sub-topic...</option>';
        
        if (subject && SUBJECTS[subject]) {
            this.elements.subtopicSelect.disabled = false;
            SUBJECTS[subject].forEach(subtopic => {
                const option = document.createElement('option');
                option.value = subtopic;
                option.textContent = subtopic;
                this.elements.subtopicSelect.appendChild(option);
            });
        } else {
            this.elements.subtopicSelect.disabled = true;
        }
    }

    handleDifficultyChange() {
        const difficulty = this.elements.difficultySelect.value;
        const info = DIFFICULTY_LEVELS[difficulty];
        
        if (info) {
            this.elements.difficultyInfo.textContent = info;
            this.elements.difficultyInfo.classList.add('show');
        } else {
            this.elements.difficultyInfo.classList.remove('show');
        }
    }

    startQuiz() {
        const subject = this.elements.subjectSelect.value;
        const difficulty = this.elements.difficultySelect.value;
        const questionLimit = parseInt(this.elements.questionsSelect.value);
        const timeLimit = parseInt(this.elements.timeSelect.value);

        if (!subject || !difficulty) {
            alert('Please select both subject and difficulty level.');
            return;
        }

        this.quiz.difficulty = difficulty;
        this.quiz.questionLimit = questionLimit;
        this.quiz.timeLimit = timeLimit;

        this.elements.setupContainer.classList.add('hidden');
        this.elements.quizContainer.classList.remove('hidden');
        this.elements.totalQuestions.textContent = questionLimit || '∞';

        this.nextQuestion();
    }

    restartQuiz() {
        this.quiz = new Quiz();
        this.elements.quizContainer.classList.add('hidden');
        this.elements.setupContainer.classList.remove('hidden');
        this.elements.scoreContainer.classList.add('hidden');
        this.elements.nextBtnContainer.classList.add('hidden');
        this.elements.currentQuestion.textContent = '1';
    }

    showSkeletonLoading() {
        this.elements.quizContent.innerHTML = `
            <div id="question-container">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
            </div>
            <div id="options-container">
                ${Array(4).fill('<div class="skeleton skeleton-option"></div>').join('')}
            </div>
        `;
    }

    async nextQuestion() {
        this.elements.nextBtnContainer.classList.add('hidden');
        this.showSkeletonLoading();
        
        const subject = this.elements.subtopicSelect.value || this.elements.subjectSelect.value;
        const question = await this.quiz.generateQuestion(subject);
        
        if (!question) {
            this.showResults();
            return;
        }

        this.quiz.currentQuestion = question;
        
        let questionContent = `
            <div id="question-container">
                <p id="question-text">${question.question}</p>
                ${question.imageUrl ? `<img src="${question.imageUrl}" alt="Medical image" class="question-image">` : ''}
            </div>
            <div id="options-container"></div>
            <div class="collapsible-sections">
                <details class="explanation-details">
                    <summary>Explanation</summary>
                    <div id="explanation-container"></div>
                </details>
                <details class="learning-objectives-details">
                    <summary>Learning Objectives</summary>
                    <div id="learning-objectives-container"></div>
                </details>
            </div>
        `;

        this.elements.quizContent.innerHTML = questionContent;

        // Update references after recreation
        this.elements.questionText = document.getElementById('question-text');
        this.elements.optionsContainer = document.getElementById('options-container');
        this.elements.explanationContainer = document.getElementById('explanation-container');
        this.elements.learningObjectivesContainer = document.getElementById('learning-objectives-container');
        
        this.elements.currentQuestion.textContent = this.quiz.questionsAnswered + 1;
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option';
            button.textContent = option;
            button.addEventListener('click', () => this.selectAnswer(index));
            this.elements.optionsContainer.appendChild(button);
        });

        if (this.quiz.timeLimit) {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.quiz.timer) {
            clearInterval(this.quiz.timer);
        }

        let timeLeft = this.quiz.timeLimit;
        this.elements.timer.textContent = `Time left: ${timeLeft}s`;

        this.quiz.timer = setInterval(() => {
            timeLeft--;
            this.elements.timer.textContent = `Time left: ${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(this.quiz.timer);
                const options = this.elements.optionsContainer.children;
                for (let option of options) {
                    option.disabled = true;
                }
                this.selectAnswer(-1); // -1 indicates time out
            }
        }, 1000);
    }

    selectAnswer(selectedIndex) {
        if (this.quiz.timer) {
            clearInterval(this.quiz.timer);
            this.elements.timer.textContent = '';
        }

        const options = this.elements.optionsContainer.children;
        for (let option of options) {
            option.disabled = true;
        }

        const correctIndex = this.quiz.currentQuestion.correctIndex;
        options[correctIndex].classList.add('correct');
        
        if (selectedIndex === correctIndex) {
            this.quiz.score++;
        } else if (selectedIndex !== -1) {
            options[selectedIndex].classList.add('wrong');
            this.quiz.wrongAnswers++;
        }

        this.quiz.questionsAnswered++;
        this.elements.nextBtnContainer.classList.remove('hidden');
        this.showExplanationAndObjectives();
    }

    async showExplanationAndObjectives() {
        const currentQuestion = this.quiz.currentQuestion;
        const explanation = await this.quiz.getExplanation(
            currentQuestion.question,
            currentQuestion.options,
            currentQuestion.correctIndex
        );

        const learningObjectives = await this.quiz.getLearningObjectives(
            currentQuestion.question,
            currentQuestion.options,
            currentQuestion.correctIndex
        );

        // Set up explanation section
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'explanation';
        explanationDiv.innerHTML = `
            <div class="explanation-content">
                <pre>${explanation.text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')}</pre>
                ${explanation.imageUrl ? `
                    <div class="explanation-image">
                        <img src="${explanation.imageUrl}" alt="Explanation diagram" class="medical-diagram">
                    </div>
                ` : ''}
            </div>
            <div class="doubt-section">
                <h4><b>Have a doubt?</b></h4>
                <div class="doubt-input-container">
                    <textarea 
                        placeholder="Type your doubt here related to this question..."
                        class="doubt-input"
                    ></textarea>
                    <button class="ask-doubt-btn">Ask Doubt</button>
                </div>
                <div class="doubt-answer hidden"></div>
            </div>
        `;

        // Set up learning objectives section
        const learningObjectivesDiv = document.createElement('div');
        learningObjectivesDiv.className = 'learning-objectives';
        learningObjectivesDiv.innerHTML = `
            <div class="learning-objectives-content">
                ${learningObjectives.content}
                ${learningObjectives.imageUrl ? `
                    <div class="learning-objectives-image">
                        <img src="${learningObjectives.imageUrl}" alt="Learning diagram" class="medical-diagram">
                    </div>
                ` : ''}
            </div>
        `;

        this.elements.explanationContainer.innerHTML = '';
        this.elements.explanationContainer.appendChild(explanationDiv);
        
        this.elements.learningObjectivesContainer.innerHTML = '';
        this.elements.learningObjectivesContainer.appendChild(learningObjectivesDiv);
        
        this.setupDoubtHandling(explanationDiv);
    }

    setupDoubtHandling(explanationDiv) {
        const doubtInput = explanationDiv.querySelector('.doubt-input');
        const askDoubtBtn = explanationDiv.querySelector('.ask-doubt-btn');
        const doubtAnswer = explanationDiv.querySelector('.doubt-answer');

        askDoubtBtn.addEventListener('click', async () => {
            const doubt = doubtInput.value.trim();
            if (!doubt) return;

            askDoubtBtn.disabled = true;
            askDoubtBtn.textContent = 'Processing...';
            
            try {
                const answer = await this.quiz.askDoubt(
                    doubt,
                    this.quiz.currentQuestion.question
                );
                
                doubtAnswer.innerHTML = `
                    <div class="doubt-text">${answer.text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')}</div>
                    ${answer.imageUrl ? `
                        <div class="doubt-image">
                            <img src="${answer.imageUrl}" alt="Explanation diagram" class="medical-diagram">
                        </div>
                    ` : ''}
                `;
                doubtAnswer.classList.remove('hidden');
            } catch (error) {
                doubtAnswer.textContent = 'Failed to get answer. Please try again.';
                doubtAnswer.classList.remove('hidden');
            } finally {
                askDoubtBtn.disabled = false;
                askDoubtBtn.textContent = 'Ask Doubt';
            }
        });
    }

    showResults() {
        const results = this.quiz.getResults();
        this.elements.quizContent.innerHTML = '';
        this.elements.scoreContainer.classList.remove('hidden');
        this.elements.nextBtnContainer.classList.add('hidden');
        
        this.elements.totalAttempted.textContent = results.total;
        this.elements.correctAnswers.textContent = results.correct;
        this.elements.wrongAnswers.textContent = results.wrong;
        this.elements.scorePercentage.textContent = `${results.percentage}%`;
    }
}