// QuizMaster - Node.js Backend Server
// server.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbPath = path.join(__dirname, 'quiz_app.db');
let db;

// Initialize database
function initDatabase() {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to SQLite database');
            
            // Check if database needs to be initialized
            db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'", (err, row) => {
                if (!row) {
                    // Database doesn't exist, create it
                    const schemaPath = path.join(__dirname, 'schema.sql');
                    if (fs.existsSync(schemaPath)) {
                        const schema = fs.readFileSync(schemaPath, 'utf8');
                        db.exec(schema, (err) => {
                            if (err) {
                                console.error('Error creating database schema:', err.message);
                            } else {
                                console.log('Database schema created successfully');
                            }
                        });
                    }
                }
            });
        }
    });
}

// API Routes

// ===============================
// QUESTIONS API
// ===============================

// Get all questions with optional filters
app.get('/api/questions', (req, res) => {
    const { category, difficulty, type, active = 1 } = req.query;
    
    let query = 'SELECT * FROM questions WHERE is_active = ?';
    let params = [active];
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    if (difficulty) {
        query += ' AND difficulty_level = ?';
        params.push(difficulty);
    }
    
    if (type) {
        query += ' AND question_type = ?';
        params.push(type);
    }
    
    query += ' ORDER BY created_date DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Parse JSON fields
        const questions = rows.map(row => ({
            ...row,
            options: JSON.parse(row.options),
            correct_answers: JSON.parse(row.correct_answers)
        }));
        
        res.json(questions);
    });
});

// Get single question by ID
app.get('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM questions WHERE id = ?', [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        
        const question = {
            ...row,
            options: JSON.parse(row.options),
            correct_answers: JSON.parse(row.correct_answers)
        };
        
        res.json(question);
    });
});

// Create new question
app.post('/api/questions', (req, res) => {
    const {
        question_text,
        question_type,
        options,
        correct_answers,
        feedback,
        difficulty_level = 1,
        category
    } = req.body;
    
    // Validation
    if (!question_text || !question_type || !options || !correct_answers) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    
    const query = `
        INSERT INTO questions (question_text, question_type, options, correct_answers, feedback, difficulty_level, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        question_text,
        question_type,
        JSON.stringify(options),
        JSON.stringify(correct_answers),
        feedback,
        difficulty_level,
        category
    ];
    
    db.run(query, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            id: this.lastID,
            message: 'Question created successfully'
        });
    });
});

// Update question
app.put('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    const {
        question_text,
        question_type,
        options,
        correct_answers,
        feedback,
        difficulty_level,
        category,
        is_active
    } = req.body;
    
    const query = `
        UPDATE questions 
        SET question_text = ?, question_type = ?, options = ?, correct_answers = ?, 
            feedback = ?, difficulty_level = ?, category = ?, is_active = ?, updated_date = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    const params = [
        question_text,
        question_type,
        JSON.stringify(options),
        JSON.stringify(correct_answers),
        feedback,
        difficulty_level,
        category,
        is_active,
        id
    ];
    
    db.run(query, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        
        res.json({ message: 'Question updated successfully' });
    });
});

// Delete question (soft delete)
app.delete('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('UPDATE questions SET is_active = 0 WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }
        
        res.json({ message: 'Question deleted successfully' });
    });
});

// ===============================
// QUIZZES API
// ===============================

// Get all quizzes
app.get('/api/quizzes', (req, res) => {
    const { active = 1 } = req.query;
    
    const query = `
        SELECT q.*, COUNT(qq.question_id) as question_count
        FROM quizzes q
        LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
        WHERE q.is_active = ?
        GROUP BY q.id
        ORDER BY q.created_date DESC
    `;
    
    db.all(query, [active], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get single quiz with questions
app.get('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    
    // Get quiz details
    db.get('SELECT * FROM quizzes WHERE id = ?', [id], (err, quiz) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!quiz) {
            res.status(404).json({ error: 'Quiz not found' });
            return;
        }
        
        // Get quiz questions
        const questionsQuery = `
            SELECT q.*, qq.question_order
            FROM questions q
            JOIN quiz_questions qq ON q.id = qq.question_id
            WHERE qq.quiz_id = ? AND q.is_active = 1
            ORDER BY qq.question_order
        `;
        
        db.all(questionsQuery, [id], (err, questions) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Parse JSON fields
            const parsedQuestions = questions.map(q => ({
                ...q,
                options: JSON.parse(q.options),
                correct_answers: JSON.parse(q.correct_answers)
            }));
            
            res.json({
                ...quiz,
                questions: parsedQuestions
            });
        });
    });
});

// Create new quiz
app.post('/api/quizzes', (req, res) => {
    const {
        quiz_name,
        description,
        category,
        time_limit,
        passing_score = 70,
        allow_retakes = 1,
        show_correct_answers = 1,
        randomize_questions = 0
    } = req.body;
    
    if (!quiz_name) {
        res.status(400).json({ error: 'Quiz name is required' });
        return;
    }
    
    const query = `
        INSERT INTO quizzes (quiz_name, description, category, time_limit, passing_score, 
                           allow_retakes, show_correct_answers, randomize_questions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
        quiz_name, description, category, time_limit, passing_score,
        allow_retakes, show_correct_answers, randomize_questions
    ];
    
    db.run(query, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        res.json({
            id: this.lastID,
            message: 'Quiz created successfully'
        });
    });
});

// Update quiz
app.put('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    const {
        quiz_name,
        description,
        category,
        time_limit,
        passing_score,
        allow_retakes,
        show_correct_answers,
        randomize_questions,
        is_active
    } = req.body;
    
    const query = `
        UPDATE quizzes 
        SET quiz_name = ?, description = ?, category = ?, time_limit = ?, passing_score = ?,
            allow_retakes = ?, show_correct_answers = ?, randomize_questions = ?, is_active = ?,
            updated_date = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    const params = [
        quiz_name, description, category, time_limit, passing_score,
        allow_retakes, show_correct_answers, randomize_questions, is_active, id
    ];
    
    db.run(query, params, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Quiz not found' });
            return;
        }
        
        res.json({ message: 'Quiz updated successfully' });
    });
});

// Add question to quiz
app.post('/api/quizzes/:id/questions', (req, res) => {
    const { id } = req.params;
    const { question_id, question_order } = req.body;
    
    if (!question_id) {
        res.status(400).json({ error: 'Question ID is required' });
        return;
    }
    
    // Get the next order number if not provided
    if (!question_order) {
        db.get('SELECT MAX(question_order) as max_order FROM quiz_questions WHERE quiz_id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const nextOrder = (row.max_order || 0) + 1;
            addQuestionToQuiz(id, question_id, nextOrder, res);
        });
    } else {
        addQuestionToQuiz(id, question_id, question_order, res);
    }
});

app.delete('/api/quizzes/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('UPDATE quizzes SET is_active = 0 WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Quiz not found' });
            return;
        }
        
        res.json({ message: 'Quiz deleted successfully' });
    });
});

function addQuestionToQuiz(quiz_id, question_id, order, res) {
    const query = 'INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES (?, ?, ?)';
    
    db.run(query, [quiz_id, question_id, order], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Question already exists in this quiz' });
            } else {
                res.status(500).json({ error: err.message });
            }
            return;
        }
        
        res.json({ message: 'Question added to quiz successfully' });
    });
}

// Remove question from quiz
app.delete('/api/quizzes/:id/questions/:questionId', (req, res) => {
    const { id, questionId } = req.params;
    
    db.run('DELETE FROM quiz_questions WHERE quiz_id = ? AND question_id = ?', [id, questionId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Question not found in quiz' });
            return;
        }
        
        res.json({ message: 'Question removed from quiz successfully' });
    });
});

// ===============================
// QUIZ ATTEMPTS API
// ===============================

// Submit quiz attempt
app.post('/api/quizzes/:id/submit', (req, res) => {
    const { id } = req.params;
    const {
        participant_name,
        participant_email,
        answers,
        time_taken,
        started_at
    } = req.body;
    
    if (!participant_name || !answers || !Array.isArray(answers)) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    
    // Get quiz questions to calculate score
    const questionsQuery = `
        SELECT q.*, qq.question_order
        FROM questions q
        JOIN quiz_questions qq ON q.id = qq.question_id
        WHERE qq.quiz_id = ? AND q.is_active = 1
        ORDER BY qq.question_order
    `;
    
    db.all(questionsQuery, [id], (err, questions) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (questions.length === 0) {
            res.status(404).json({ error: 'Quiz not found or has no questions' });
            return;
        }
        
        // Calculate score
        let score = 0;
        const detailedAnswers = [];
        
        questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const correctAnswers = JSON.parse(question.correct_answers);
            let isCorrect = false;
            
            if (question.question_type === 'multiple-choice-multiple') {
                // For multiple answer questions
                const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                isCorrect = arraysEqual(userAnswerArray.sort(), correctAnswers.sort());
            } else {
                // For single answer questions
                isCorrect = correctAnswers.includes(userAnswer);
            }
            
            if (isCorrect) {
                score++;
            }
            
            detailedAnswers.push({
                question_id: question.id,
                user_answer: userAnswer,
                correct_answers: correctAnswers,
                correct: isCorrect
            });
        });
        
        const totalQuestions = questions.length;
        const percentage = (score / totalQuestions) * 100;
        
        // Get quiz passing score
        db.get('SELECT passing_score FROM quizzes WHERE id = ?', [id], (err, quiz) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            const passed = percentage >= (quiz.passing_score || 70);
            
            // Save attempt
            const insertQuery = `
                INSERT INTO quiz_attempts (quiz_id, participant_name, participant_email, score, total_questions, 
                                         percentage, time_taken, answers, passed, started_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                id, participant_name, participant_email, score, totalQuestions,
                percentage, time_taken, JSON.stringify(detailedAnswers), passed, started_at
            ];
            
            db.run(insertQuery, params, function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Update question usage counts
                questions.forEach(question => {
                    db.run('UPDATE questions SET usage_count = usage_count + 1 WHERE id = ?', [question.id]);
                });
                
                res.json({
                    attempt_id: this.lastID,
                    score,
                    total_questions: totalQuestions,
                    percentage: Math.round(percentage * 100) / 100,
                    passed,
                    detailed_answers: detailedAnswers
                });
            });
        });
    });
});

// Get quiz attempts/results
app.get('/api/quizzes/:id/attempts', (req, res) => {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const query = `
        SELECT * FROM quiz_attempts 
        WHERE quiz_id = ? 
        ORDER BY completed_at DESC 
        LIMIT ? OFFSET ?
    `;
    
    db.all(query, [id, limit, offset], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Parse answers JSON
        const attempts = rows.map(row => ({
            ...row,
            answers: JSON.parse(row.answers)
        }));
        
        res.json(attempts);
    });
});

// ===============================
// ANALYTICS & LEADERBOARD API
// ===============================

// Get leaderboard
app.get('/api/leaderboard/:quizId?', (req, res) => {
    const { quizId } = req.params;
    const { limit = 10 } = req.query;
    
    let query;
    let params;
    
    if (quizId) {
        query = `
            SELECT participant_name, quiz_name, score, percentage, completed_at,
                   RANK() OVER (ORDER BY percentage DESC, time_taken ASC) as rank
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.quiz_id = ? AND qa.passed = 1
            ORDER BY percentage DESC, time_taken ASC
            LIMIT ?
        `;
        params = [quizId, limit];
    } else {
        query = `
            SELECT participant_name, quiz_name, score, percentage, completed_at,
                   RANK() OVER (PARTITION BY quiz_id ORDER BY percentage DESC, time_taken ASC) as rank
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            WHERE qa.passed = 1
            ORDER BY qa.quiz_id, percentage DESC, time_taken ASC
            LIMIT ?
        `;
        params = [limit];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Get quiz statistics
app.get('/api/stats/quiz/:id?', (req, res) => {
    const { id } = req.params;
    
    let query;
    let params = [];
    
    if (id) {
        query = `
            SELECT 
                q.quiz_name,
                COUNT(qa.id) as total_attempts,
                AVG(qa.percentage) as avg_score,
                MAX(qa.percentage) as highest_score,
                MIN(qa.percentage) as lowest_score,
                COUNT(CASE WHEN qa.passed = 1 THEN 1 END) as passed_count,
                AVG(qa.time_taken) as avg_time_taken
            FROM quizzes q
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
            WHERE q.id = ?
            GROUP BY q.id, q.quiz_name
        `;
        params = [id];
    } else {
        query = `
            SELECT 
                q.id,
                q.quiz_name,
                COUNT(qa.id) as total_attempts,
                AVG(qa.percentage) as avg_score,
                MAX(qa.percentage) as highest_score,
                MIN(qa.percentage) as lowest_score,
                COUNT(CASE WHEN qa.passed = 1 THEN 1 END) as passed_count,
                AVG(qa.time_taken) as avg_time_taken
            FROM quizzes q
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
            WHERE q.is_active = 1
            GROUP BY q.id, q.quiz_name
            ORDER BY total_attempts DESC
        `;
    }
    
    if (id) {
        db.get(query, params, (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row || {});
        });
    } else {
        db.all(query, params, (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    }
});

// Get categories
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Utility functions
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

// Start server
initDatabase();
app.listen(PORT, () => {
    console.log(`🚀 QuizMaster API server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log(`🧠 Quiz Interface: http://localhost:${PORT}/index.html`);
    console.log(`🏆 Leaderboard: http://localhost:${PORT}/leaderboard.html`);
    console.log(`💾 Database: ${dbPath}`);
});