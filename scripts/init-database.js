// QuizMaster - Database Initialization Script
// scripts/init-database.js

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'quiz_app.db');
const schemaPath = path.join(__dirname, '..', 'schema.sql');

// Create database and initialize schema
function initializeDatabase() {
    console.log('📚 Initializing QuizMaster Database...');
    
    // Remove existing database if it exists
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('✓ Removed existing database');
    }
    
    // Create new database
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Error creating database:', err.message);
            process.exit(1);
        }
        console.log('✓ Database created successfully');
    });
    
    // Read and execute schema
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Error executing schema:', err.message);
            process.exit(1);
        }
        console.log('✓ Database schema created successfully');
        
        // Insert additional sample data
        insertAdditionalSampleData(db);
    });
}

// Insert additional sample data (beyond what's in schema.sql)
function insertAdditionalSampleData(db) {
    console.log('📝 Inserting additional sample data...');
    
    // Additional sample questions (schema.sql already has 5)
    const additionalQuestions = [
        {
            question_text: "World War II ended in 1945.",
            question_type: "true-false",
            options: ["True", "False"],
            correct_answers: ["True"],
            feedback: "World War II officially ended in 1945 with the surrender of Japan in September.",
            difficulty_level: 2,
            category: "History"
        },
        {
            question_text: "Who wrote 'Romeo and Juliet'?",
            question_type: "multiple-choice",
            options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
            correct_answers: ["William Shakespeare"],
            feedback: "Romeo and Juliet is a famous tragedy written by William Shakespeare in the early part of his career.",
            difficulty_level: 2,
            category: "Literature"
        },
        {
            question_text: "Which of these are planets in our solar system?",
            question_type: "multiple-choice-multiple",
            options: ["Mars", "Jupiter", "Pluto", "Venus", "Moon", "Saturn"],
            correct_answers: ["Mars", "Jupiter", "Venus", "Saturn"],
            feedback: "Mars, Jupiter, Venus, and Saturn are planets. Pluto is now classified as a dwarf planet, and the Moon is Earth's satellite.",
            difficulty_level: 3,
            category: "Science"
        },
        {
            question_text: "The Great Wall of China is visible from space with the naked eye.",
            question_type: "true-false",
            options: ["True", "False"],
            correct_answers: ["False"],
            feedback: "This is a common myth. The Great Wall of China is not visible from space with the naked eye without aid.",
            difficulty_level: 3,
            category: "General Knowledge"
        },
        {
            question_text: "What is the largest ocean on Earth?",
            question_type: "multiple-choice",
            options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
            correct_answers: ["Pacific Ocean"],
            feedback: "The Pacific Ocean is the largest ocean, covering about one-third of Earth's surface.",
            difficulty_level: 2,
            category: "Geography"
        },
        {
            question_text: "What is the square root of 144?",
            question_type: "multiple-choice",
            options: ["10", "11", "12", "13"],
            correct_answers: ["12"],
            feedback: "The square root of 144 is 12, because 12 × 12 = 144.",
            difficulty_level: 2,
            category: "Mathematics"
        }
    ];

    // Insert additional sample questions
    const insertQuestionStmt = db.prepare(`
        INSERT INTO questions (question_text, question_type, options, correct_answers, feedback, difficulty_level, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    additionalQuestions.forEach(question => {
        insertQuestionStmt.run(
            question.question_text,
            question.question_type,
            JSON.stringify(question.options),
            JSON.stringify(question.correct_answers),
            question.feedback,
            question.difficulty_level,
            question.category
        );
    });

    insertQuestionStmt.finalize();

    // Additional sample quizzes (schema.sql already has 1)
    const additionalQuizzes = [
        {
            quiz_name: "Science Basics",
            description: "Test your knowledge of basic scientific facts and concepts",
            category: "Science",
            time_limit: 12,
            passing_score: 75
        },
        {
            quiz_name: "World Geography",
            description: "How well do you know world geography and locations?",
            category: "Geography",
            time_limit: 15,
            passing_score: 70
        },
        {
            quiz_name: "Quick Math Challenge",
            description: "Test your mathematical skills with these problems",
            category: "Mathematics",
            time_limit: 8,
            passing_score: 80
        },
        {
            quiz_name: "History & Literature",
            description: "Questions about historical events and famous literary works",
            category: "General Knowledge",
            time_limit: 20,
            passing_score: 70
        }
    ];

    // Insert additional sample quizzes
    const insertQuizStmt = db.prepare(`
        INSERT INTO quizzes (quiz_name, description, category, time_limit, passing_score)
        VALUES (?, ?, ?, ?, ?)
    `);

    additionalQuizzes.forEach(quiz => {
        insertQuizStmt.run(
            quiz.quiz_name,
            quiz.description,
            quiz.category,
            quiz.time_limit,
            quiz.passing_score
        );
    });

    insertQuizStmt.finalize();

    // Create quiz-question relationships
    db.serialize(() => {
        // Science Basics Quiz (ID: 2) - science questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (2, 1, 1)'); // Earth revolves around Sun
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (2, 3, 2)'); // Water boiling point
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (2, 8, 3)'); // Planets in solar system

        // World Geography Quiz (ID: 3) - geography questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (3, 2, 1)'); // Capital of France
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (3, 10, 2)'); // Largest ocean

        // Quick Math Challenge Quiz (ID: 4) - math questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (4, 5, 1)'); // 12 × 8
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (4, 11, 2)'); // Square root of 144

        // History & Literature Quiz (ID: 5) - mixed questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (5, 6, 1)'); // WWII ended in 1945
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (5, 7, 2)'); // Romeo and Juliet author
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (5, 9, 3)'); // Great Wall of China

        // Insert some sample quiz attempts for demonstration
        const sampleAttempts = [
            {
                quiz_id: 1,
                participant_name: "Alex Johnson",
                participant_email: "alex@example.com",
                score: 4,
                total_questions: 5,
                percentage: 80,
                time_taken: 480,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 1, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 2, user_answer: "Paris", correct_answers: ["Paris"], correct: true},
                    {question_id: 3, user_answer: "False", correct_answers: ["True"], correct: false},
                    {question_id: 4, user_answer: ["Red", "Blue", "Yellow"], correct_answers: ["Red", "Blue", "Yellow"], correct: true},
                    {question_id: 5, user_answer: "96", correct_answers: ["96"], correct: true}
                ])
            },
            {
                quiz_id: 1,
                participant_name: "Sam Taylor",
                participant_email: "sam@example.com",
                score: 5,
                total_questions: 5,
                percentage: 100,
                time_taken: 420,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 1, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 2, user_answer: "Paris", correct_answers: ["Paris"], correct: true},
                    {question_id: 3, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 4, user_answer: ["Red", "Blue", "Yellow"], correct_answers: ["Red", "Blue", "Yellow"], correct: true},
                    {question_id: 5, user_answer: "96", correct_answers: ["96"], correct: true}
                ])
            },
            {
                quiz_id: 2,
                participant_name: "Jordan Lee",
                participant_email: "jordan@example.com",
                score: 3,
                total_questions: 3,
                percentage: 100,
                time_taken: 300,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 1, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 3, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 8, user_answer: ["Mars", "Jupiter", "Venus", "Saturn"], correct_answers: ["Mars", "Jupiter", "Venus", "Saturn"], correct: true}
                ])
            },
            {
                quiz_id: 3,
                participant_name: "Casey Morgan",
                participant_email: "casey@example.com",
                score: 2,
                total_questions: 2,
                percentage: 100,
                time_taken: 180,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 2, user_answer: "Paris", correct_answers: ["Paris"], correct: true},
                    {question_id: 10, user_answer: "Pacific Ocean", correct_answers: ["Pacific Ocean"], correct: true}
                ])
            },
            {
                quiz_id: 4,
                participant_name: "Riley Chen",
                participant_email: "riley@example.com",
                score: 2,
                total_questions: 2,
                percentage: 100,
                time_taken: 120,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 5, user_answer: "96", correct_answers: ["96"], correct: true},
                    {question_id: 11, user_answer: "12", correct_answers: ["12"], correct: true}
                ])
            }
        ];

        const insertAttemptStmt = db.prepare(`
            INSERT INTO quiz_attempts (quiz_id, participant_name, participant_email, score, total_questions, percentage, time_taken, passed, answers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sampleAttempts.forEach(attempt => {
            insertAttemptStmt.run(
                attempt.quiz_id,
                attempt.participant_name,
                attempt.participant_email,
                attempt.score,
                attempt.total_questions,
                attempt.percentage,
                attempt.time_taken,
                attempt.passed,
                attempt.answers
            );
        });

        insertAttemptStmt.finalize();

        console.log('✓ Additional sample questions inserted');
        console.log('✓ Additional sample quizzes created');
        console.log('✓ Quiz-question relationships established');
        console.log('✓ Sample quiz attempts added');
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✓ Database connection closed');
                console.log('🎉 Database initialization complete!');
                console.log('');
                console.log('📊 Database Summary:');
                console.log('   • Questions: 11 (various types and difficulties)');
                console.log('   • Quizzes: 5 (General Knowledge, Science, Geography, Math, History & Literature)');
                console.log('   • Categories: 6 (General Knowledge, Science, History, Geography, Literature, Mathematics)');
                console.log('   • Sample Results: 5 quiz attempts for demonstration');
                console.log('');
                console.log('🚀 You can now start the server with: npm start');
                console.log('🌐 Quiz Interface: http://localhost:3000/index.html');
                console.log('📊 Admin Dashboard: http://localhost:3000/admin.html');
                console.log('🏆 Leaderboard: http://localhost:3000/leaderboard.html');
            }
        });
    });
}

// Run initialization
initializeDatabase();