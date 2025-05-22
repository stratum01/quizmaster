# 🧠 QuizMaster - Interactive Learning Platform

A modern, responsive quiz management system built with Node.js, SQLite, and contemporary web technologies. Create, manage, and analyze educational quizzes with a beautiful, professional interface.
 ![Image Alt](https://github.com/stratum01/quizmaster/blob/fdd0e7bfa3398a6775784b482ad42ffe2238de09/screenshots/01-quiz_list_index.png)
 
## ✨ Features

### 🎯 Quiz Taking Experience
- **Multiple Question Types**: True/False, Multiple Choice (single), Multiple Choice (multiple answers)
- **Modern Interface**: Clean design with smooth animations and intuitive navigation
- **Progress Tracking**: Visual progress indicators and real-time feedback
- **Timer Support**: Optional time limits with visual warnings
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile devices
- **Instant Results**: Detailed question-by-question analysis and scoring

### 👩‍💼 Administrative Dashboard
- **Question Management**: Create, edit, and organize questions with categories and difficulty levels
- **Quiz Builder**: Flexible quiz creation with customizable settings
- **Performance Analytics**: Track participant results and generate insights
- **Leaderboards**: Real-time rankings and achievement tracking
- **Statistics Dashboard**: Comprehensive reporting and data visualization

### 🗄️ Database & Backend
- **SQLite Database**: Lightweight, file-based database with full SQL support
- **RESTful API**: Clean, documented API endpoints for all operations
- **Data Integrity**: Foreign key constraints and proper indexing
- **Easy Backup**: Simple database backup and restoration process

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd quizmaster-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Access the application**
   - **Quiz Interface**: http://localhost:3000/index.html
   - **Admin Dashboard**: http://localhost:3000/admin.html
   - **Leaderboard**: http://localhost:3000/leaderboard.html

## 📁 Project Structure

```
quizmaster-app/
├── server.js                 # Main Node.js server
├── package.json              # Project dependencies
├── schema.sql                # Database schema
├── scripts/
│   └── init-database.js      # Database initialization
├── public/                   # Web application files
│   ├── index.html            # Quiz taking interface
│   ├── admin.html            # Admin dashboard
│   └── leaderboard.html      # Leaderboard page
└── quiz_app.db              # SQLite database (created after init)
```

## 🎮 Usage Guide

### For Quiz Takers

1. **Browse Available Quizzes**: View quiz descriptions, question counts, and time limits
2. **Enter Information**: Provide your name and optional email
3. **Take the Quiz**: Answer questions with immediate feedback
4. **View Results**: See detailed breakdown of your performance
5. **Check Leaderboard**: Compare your scores with other participants

### For Administrators

1. **Dashboard Overview**: Monitor system statistics and recent activity
2. **Question Management**: 
   - Create questions with multiple types and difficulty levels
   - Organize by categories
   - Track usage statistics
3. **Quiz Configuration**:
   - Build quizzes from question pools
   - Set time limits and passing scores
   - Configure quiz behavior options
4. **Results Analysis**: 
   - View participant performance
   - Export data for further analysis
   - Monitor completion rates and trends

### Question Types Supported

#### True/False Questions
Simple binary choice questions with explanatory feedback.

#### Multiple Choice (Single Answer)
Traditional multiple choice with one correct answer.

#### Multiple Choice (Multiple Answers)
Allow participants to select multiple correct answers from the options.

## 🗄️ Database Schema

### Core Tables

- **questions**: Question content, types, options, correct answers, and metadata
- **quizzes**: Quiz configuration, settings, and properties
- **quiz_questions**: Many-to-many relationship linking quizzes to questions
- **quiz_attempts**: Participant results and detailed answer tracking
- **categories**: Question categorization system

### Key Features

- **Referential Integrity**: Foreign key constraints ensure data consistency
- **JSON Storage**: Complex data structures efficiently stored as JSON
- **Optimized Queries**: Strategic indexing for fast performance
- **Analytics Views**: Pre-built views for common reporting needs

## 🔧 API Documentation

### Questions Endpoints
- `GET /api/questions` - List questions with optional filtering
- `GET /api/questions/:id` - Retrieve specific question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update existing question
- `DELETE /api/questions/:id` - Soft delete question

### Quizzes Endpoints
- `GET /
