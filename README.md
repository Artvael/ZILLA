# ZILLA - Task Manager

A beautiful, productivity-focused task manager built with Laravel, featuring a glassmorphism UI and advanced analytics.

## Features
- **Modern UI**: Custom pink/magenta glassmorphism design with fluid animations.
- **Task Management**: Create, edit, delete, and favorite tasks.
- **Productivity Analytics**: Detailed charts tracking completion rates, progress over time, and task priorities.
- **Smart Tracking**: Automatic calculation of overdue tasks and dynamic progress rings.
- **Secure Authentication**: Built-in user registration and login.

## Tech Stack
- **Backend**: Laravel 12
- **Frontend**: Vanilla JS (SPA architecture) + Custom CSS
- **Database**: SQLite (default) / MySQL

## Running Locally

1. Install PHP dependencies:
   ```bash
   composer install
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Set up the environment file:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. Run database migrations:
   ```bash
   php artisan migrate
   ```

5. Build the frontend assets:
   ```bash
   npm run build
   ```

6. Start the local server:
   ```bash
   php artisan serve
   ```

Visit `http://localhost:8000` in your browser to see the app!
