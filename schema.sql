-- QuizMaster Database Schema
-- SQLite Database Structure for Interactive Quiz Application

-- Questions table
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('true-false', 'multiple-choice', 'multiple-choice-multiple')),
    options TEXT NOT NULL, -- JSON array of options
    correct_answers TEXT NOT NULL, -- JSON array of correct answers
    feedback TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    category TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);

-- Quizzes table
CREATE TABLE quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_name TEXT NOT NULL UNIQUE,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT 1,
    time_limit INTEGER, -- in minutes, NULL for no limit
    passing_score INTEGER DEFAULT 70, -- percentage
    allow_retakes BOOLEAN DEFAULT 1,
    show_correct_answers BOOLEAN DEFAULT 1,
    randomize_questions BOOLEAN DEFAULT 0,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quiz-Questions relationship (many-to-many)
CREATE TABLE quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    question_order INTEGER NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(quiz_id, question_id)
);

-- Quiz attempts/results
CREATE TABLE quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL,
    participant_name TEXT NOT NULL,
    participant_email TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    time_taken INTEGER, -- in seconds
    answers TEXT NOT NULL, -- JSON array of user answers
    passed BOOLEAN NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Question categories for organization
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_active ON questions(is_active);
CREATE INDEX idx_quizzes_active ON quizzes(is_active);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_participant ON quiz_attempts(participant_name);
CREATE INDEX idx_quiz_attempts_score ON quiz_attempts(score DESC);
CREATE INDEX idx_quiz_attempts_completed ON quiz_attempts(completed_at DESC);

-- Sample data insertion
INSERT INTO categories (name, description) VALUES 
('General Knowledge', 'Basic knowledge and common facts'),
('Science', 'Science and technology questions'),
('Mathematics', 'Mathematical concepts and problems'),
('History', 'Historical events and figures'),
('Geography', 'World geography and locations'),
('Literature', 'Books, authors, and literary works');

-- Sample questions
INSERT INTO questions (question_text, question_type, options, correct_answers, feedback, difficulty_level, category) VALUES 
('The Earth revolves around the Sun.', 'true-false', '["True", "False"]', '["True"]', 'Correct! The Earth orbits around the Sun, completing one revolution approximately every 365.25 days.', 1, 'Science'),
('What is the capital of France?', 'multiple-choice', '["London", "Berlin", "Paris", "Madrid"]', '["Paris"]', 'Paris is the capital and largest city of France, known for landmarks like the Eiffel Tower and Louvre Museum.', 1, 'Geography'),
('Water boils at 100 degrees Celsius at sea level.', 'true-false', '["True", "False"]', '["True"]', 'Yes, water boils at 100°C (212°F) at standard atmospheric pressure (sea level).', 2, 'Science'),
('Which of these are primary colors?', 'multiple-choice-multiple', '["Red", "Green", "Blue", "Yellow", "Purple", "Orange"]', '["Red", "Blue", "Yellow"]', 'In traditional color theory, the primary colors are red, blue, and yellow. These cannot be created by mixing other colors.', 2, 'General Knowledge'),
('What is 12 × 8?', 'multiple-choice', '["84", "96", "108", "112"]', '["96"]', '12 × 8 = 96. This is a basic multiplication problem.', 2, 'Mathematics');

-- Sample quiz
INSERT INTO quizzes (quiz_name, description, category, time_limit, passing_score) VALUES 
('General Knowledge Quiz', 'Test your general knowledge with this introductory quiz', 'General Knowledge', 10, 70);

-- Link questions to quiz
INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES 
(1, 1, 1),
(1, 2, 2),
(1, 3, 3),
(1, 4, 4),
(1, 5, 5);

-- Views for common queries
CREATE VIEW quiz_stats AS
SELECT 
    q.id,
    q.quiz_name,
    COUNT(qq.question_id) as question_count,
    COUNT(qa.id) as attempt_count,
    AVG(qa.percentage) as avg_score,
    MAX(qa.percentage) as highest_score,
    MIN(qa.percentage) as lowest_score
FROM quizzes q
LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
WHERE q.is_active = 1
GROUP BY q.id, q.quiz_name;

CREATE VIEW leaderboard AS
SELECT 
    qa.participant_name,
    q.quiz_name,
    qa.score,
    qa.percentage,
    qa.completed_at,
    RANK() OVER (PARTITION BY qa.quiz_id ORDER BY qa.percentage DESC, qa.time_taken ASC) as rank
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
WHERE qa.passed = 1
ORDER BY qa.quiz_id, rank;

CREATE VIEW question_analytics AS
SELECT 
    q.id,
    q.question_text,
    q.category,
    q.difficulty_level,
    q.usage_count,
    COUNT(qa.id) as times_answered,
    AVG(CASE WHEN JSON_EXTRACT(qa.answers, '$[' || (qq.question_order - 1) || '].correct') = 'true' THEN 1.0 ELSE 0.0 END) as success_rate
FROM questions q
LEFT JOIN quiz_questions qq ON q.id = qq.question_id
LEFT JOIN quiz_attempts qa ON qq.quiz_id = qa.quiz_id
WHERE q.is_active = 1
GROUP BY q.id, q.question_text, q.category, q.difficulty_level, q.usage_count;