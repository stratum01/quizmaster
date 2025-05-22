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
        insertSampleData(db);
    });
}

// Insert additional sample data
function insertSampleData(db) {
    console.log('📝 Inserting sample data...');
    
    // Sample categories for general knowledge
    const sampleCategories = [
        { name: 'General Knowledge', description: 'Basic knowledge questions' },
        { name: 'Science', description: 'Science and technology questions' },
        { name: 'History', description: 'Historical events and figures' },
        { name: 'Geography', description: 'World geography and locations' },
        { name: 'Literature', description: 'Books, authors, and literary works' },
        { name: 'Mathematics', description: 'Mathematical concepts and problems' }
    ];

    // Insert categories
    const insertCategoryStmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    sampleCategories.forEach(category => {
        insertCategoryStmt.run(category.name, category.description);
    });
    insertCategoryStmt.finalize();

    // Sample questions for different categories
    const sampleQuestions = [
        {
            question_text: "The Earth revolves around the Sun.",
            question_type: "true-false",
            options: ["True", "False"],
            correct_answers: ["True"],
            feedback: "Yes, the Earth orbits around the Sun, completing one revolution approximately every 365.25 days.",
            difficulty_level: 1,
            category: "Science"
        },
        {
            question_text: "What is the capital of France?",
            question_type: "multiple-choice",
            options: ["London", "Berlin", "Paris", "Madrid"],
            correct_answers: ["Paris"],
            feedback: "Paris is the capital and largest city of France.",
            difficulty_level: 1,
            category: "Geography"
        },
        {
            question_text: "Which of these are primary colors?",
            question_type: "multiple-choice-multiple",
            options: ["Red", "Green", "Blue", "Yellow", "Purple", "Orange"],
            correct_answers: ["Red", "Blue", "Yellow"],
            feedback: "The primary colors in traditional color theory are red, blue, and yellow.",
            difficulty_level: 2,
            category: "General Knowledge"
        },
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
            feedback: "Romeo and Juliet is a famous tragedy written by William Shakespeare.",
            difficulty_level: 2,
            category: "Literature"
        },
        {
            question_text: "What is 15 × 8?",
            question_type: "multiple-choice",
            options: ["120", "125", "110", "130"],
            correct_answers: ["120"],
            feedback: "15 × 8 = 120. This is basic multiplication.",
            difficulty_level: 2,
            category: "Mathematics"
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
            feedback: "This is a common myth. The Great Wall of China is not visible from space with the naked eye.",
            difficulty_level: 3,
            category: "General Knowledge"
        }
    ];

    // Insert sample questions
    const insertQuestionStmt = db.prepare(`
        INSERT INTO questions (question_text, question_type, options, correct_answers, feedback, difficulty_level, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    sampleQuestions.forEach(question => {
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

    // Sample quizzes
    const sampleQuizzes = [
        {
            quiz_name: "General Knowledge Quiz",
            description: "Test your general knowledge with this mixed quiz",
            category: "General Knowledge",
            time_limit: 10,
            passing_score: 70
        },
        {
            quiz_name: "Science Basics",
            description: "Basic science questions for beginners",
            category: "Science",
            time_limit: 12,
            passing_score: 75
        },
        {
            quiz_name: "Quick Math Challenge",
            description: "Test your mathematical skills",
            category: "Mathematics",
            time_limit: 8,
            passing_score: 80
        },
        {
            quiz_name: "World Geography",
            description: "How well do you know world geography?",
            category: "Geography",
            time_limit: 15,
            passing_score: 70
        }
    ];

    // Insert sample quizzes
    const insertQuizStmt = db.prepare(`
        INSERT INTO quizzes (quiz_name, description, category, time_limit, passing_score)
        VALUES (?, ?, ?, ?, ?)
    `);

    sampleQuizzes.forEach(quiz => {
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
        // General Knowledge Quiz (ID: 1) - mixed questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (1, 1, 1)'); // Earth revolves around Sun
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (1, 3, 2)'); // Primary colors
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (1, 8, 3)'); // Great Wall of China
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (1, 4, 4)'); // WWII ended in 1945

        // Science Basics Quiz (ID: 2) - science questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (2, 1, 1)'); // Earth revolves around Sun
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (2, 7, 2)'); // Planets in solar system

        // Quick Math Challenge (ID: 3) - math questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (3, 6, 1)'); // 15 × 8

        // World Geography Quiz (ID: 4) - geography questions
        db.run('INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (4, 2, 1)'); // Capital of France

        // Insert some sample quiz attempts for demonstration
        const sampleAttempts = [
            {
                quiz_id: 1,
                participant_name: "Alex Johnson",
                participant_email: "alex@example.com",
                score: 3,
                total_questions: 4,
                percentage: 75,
                time_taken: 480,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 1, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 3, user_answer: ["Red", "Blue", "Yellow"], correct_answers: ["Red", "Blue", "Yellow"], correct: true},
                    {question_id: 8, user_answer: "True", correct_answers: ["False"], correct: false},
                    {question_id: 4, user_answer: "True", correct_answers: ["True"], correct: true}
                ])
            },
            {
                quiz_id: 1,
                participant_name: "Sam Taylor",
                participant_email: "sam@example.com",
                score: 4,
                total_questions: 4,
                percentage: 100,
                time_taken: 420,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 1, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 3, user_answer: ["Red", "Blue", "Yellow"], correct_answers: ["Red", "Blue", "Yellow"], correct: true},
                    {question_id: 8, user_answer: "False", correct_answers: ["False"], correct: true},
                    {question_id: 4, user_answer: "True", correct_answers: ["True"], correct: true}
                ])
            },
            {
                quiz_id: 2,
                participant_name: "Jordan Lee",
                participant_email: "jordan@example.com",
                score: 2,
                total_questions: 2,
                percentage: 100,
                time_taken: 300,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 1, user_answer: "True", correct_answers: ["True"], correct: true},
                    {question_id: 7, user_answer: ["Mars", "Jupiter", "Venus", "Saturn"], correct_answers: ["Mars", "Jupiter", "Venus", "Saturn"], correct: true}
                ])
            },
            {
                quiz_id: 3,
                participant_name: "Casey Morgan",
                participant_email: "casey@example.com",
                score: 1,
                total_questions: 1,
                percentage: 100,
                time_taken: 45,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 6, user_answer: "120", correct_answers: ["120"], correct: true}
                ])
            },
            {
                quiz_id: 4,
                participant_name: "Riley Chen",
                participant_email: "riley@example.com",
                score: 1,
                total_questions: 1,
                percentage: 100,
                time_taken: 30,
                passed: 1,
                answers: JSON.stringify([
                    {question_id: 2, user_answer: "Paris", correct_answers: ["Paris"], correct: true}
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

        console.log('✓ Sample questions inserted');
        console.log('✓ Sample quizzes created');
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
                console.log('   • Questions: 8 (various types and difficulties)');
                console.log('   • Quizzes: 4 (General Knowledge, Science, Math, Geography)');
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