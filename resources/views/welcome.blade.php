<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>ZILLA — Task Manager</title>
    <meta name="description" content="ZILLA is a premium task manager app to organize your work beautifully.">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>

<!-- Toast Container -->
<div id="toast-container" class="toast-container"></div>

<!-- ==================== WELCOME SCREEN ==================== -->
<div id="welcome-screen" class="screen active">
    <div class="welcome-content">
        <img src="/images/mascot.png" alt="ZILLA Mascot" class="welcome-mascot">
        <h1 class="welcome-title">WELCOME TO ZILLA</h1>
        <p class="welcome-subtitle">A Task Manager App</p>
        <div class="welcome-actions">
            <button id="btn-get-started" class="btn btn-primary">GET STARTED</button>
            <button id="btn-welcome-login" class="btn btn-outline">LOGIN</button>
        </div>
        <br>
        <button id="btn-learn-more" class="link-btn">LEARN MORE</button>
    </div>
</div>

<!-- ==================== AUTH SCREEN ==================== -->
<div id="auth-screen" class="screen">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <img src="/images/mascot.png" alt="Avatar" class="auth-avatar">
                <h2 id="auth-title" class="auth-title">LOGIN</h2>
            </div>
            <form id="auth-form" data-mode="login">
                <div class="form-group" id="name-group" style="display:none">
                    <label class="form-label" for="auth-name">Full Name</label>
                    <input class="form-input" type="text" id="auth-name" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label class="form-label" for="auth-email">Email</label>
                    <input class="form-input" type="email" id="auth-email" placeholder="you@email.com" required>
                </div>
                <div class="form-group">
                    <label class="form-label" for="auth-password">Password</label>
                    <input class="form-input" type="password" id="auth-password" placeholder="••••••••" required>
                </div>
                <div class="form-group" id="confirm-group" style="display:none">
                    <label class="form-label" for="auth-password-confirm">Confirm Password</label>
                    <input class="form-input" type="password" id="auth-password-confirm" placeholder="••••••••">
                </div>
                <div class="form-group" style="text-align:right">
                    <a id="forgot-password-link" style="color:var(--pink-1);font-size:.85rem;cursor:pointer">Forgot Password?</a>
                </div>
                <div class="form-actions">
                    <button type="submit" id="auth-submit" class="btn btn-pink">LOGIN</button>
                </div>
                <div class="auth-toggle" id="auth-toggle-register" style="margin-top:16px;text-align:center">
                    Don't have an account? <a id="toggle-to-register">SIGN UP</a>
                </div>
                <div class="auth-toggle" id="auth-toggle-login" style="margin-top:16px;text-align:center;display:none">
                    Already have an account? <a id="toggle-to-login">Login</a>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- ==================== DASHBOARD SCREEN ==================== -->
<div id="dashboard-screen" class="screen">
    <!-- Sidebar -->
    <aside class="sidebar">
        <div class="sidebar-brand">
            <h1>ZILLA</h1>
            <p>Task Manager</p>
        </div>
        <nav class="sidebar-nav">
            <button class="nav-item active" data-view="all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>
                All Tasks
            </button>
            <button class="nav-item" data-view="favourites">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                Favourites
            </button>
            <button class="nav-item" data-view="completed">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Completed
            </button>
            <button class="nav-item" onclick="App.showScreen('stats')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                Statistics
            </button>
        </nav>
        <div class="sidebar-user">
            <img src="/images/mascot.png" alt="User" class="sidebar-user-avatar">
            <div class="sidebar-user-info">
                <div id="sidebar-user-name" class="sidebar-user-name">User</div>
                <div id="sidebar-user-email" class="sidebar-user-email">user@email.com</div>
            </div>
            <button id="btn-logout" class="btn-icon" title="Logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
        <div class="main-header">
            <div class="greeting">
                <h2 id="greeting-name">Hello!!</h2>
                <p>Here's your productivity overview</p>
            </div>
            <div class="header-actions">
                <div class="search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    <input type="text" id="search-input" placeholder="Search tasks...">
                </div>
                <button id="btn-add-task" class="btn btn-pink btn-sm">+ New Task</button>
            </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
                <div id="stat-total" class="stat-value">0</div>
                <div class="stat-label">Total Tasks</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
                <div id="stat-progress" class="stat-value">0</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div id="stat-completed" class="stat-value">0</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                <div id="stat-avg" class="stat-value">0%</div>
                <div class="stat-label">Avg Progress</div>
            </div>
        </div>

        <!-- Tasks Section -->
        <div class="section">
            <div class="section-header">
                <h3 class="section-title">Your Tasks</h3>
                <div class="section-tabs">
                    <button class="tab-btn active" data-cat="all">All</button>
                    <button class="tab-btn" data-cat="school">School</button>
                    <button class="tab-btn" data-cat="work">Work</button>
                    <button class="tab-btn" data-cat="personal">Personal</button>
                </div>
            </div>
            <div id="task-list" class="task-grid">
                <div class="empty-state"><h3>Loading...</h3></div>
            </div>
        </div>
    </main>
</div>

<!-- ==================== DETAIL SCREEN ==================== -->
<div id="detail-screen" class="screen">
    <aside class="sidebar">
        <div class="sidebar-brand"><h1>ZILLA</h1><p>Task Manager</p></div>
        <nav class="sidebar-nav">
            <button class="nav-item" onclick="App.showScreen('dashboard')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>
                Back to Tasks
            </button>
        </nav>
    </aside>
    <div class="detail-content">
        <button id="detail-back-btn" class="detail-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M15 19l-7-7 7-7"/></svg>
            Back to Dashboard
        </button>
        <div class="detail-card">
            <span id="detail-cat" class="detail-category">general</span>
            <h1 id="detail-title" class="detail-title">Task Title</h1>
            <p id="detail-desc" class="detail-desc">Task description goes here.</p>
            <p id="detail-due" class="task-due" style="margin-bottom:24px"></p>

            <div class="detail-progress-section">
                <div class="circular-progress">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                        <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#e84393"/>
                                <stop offset="100%" stop-color="#6c3483"/>
                            </linearGradient>
                        </defs>
                        <circle class="track" cx="70" cy="70" r="60"/>
                        <circle class="fill" id="progress-circle" cx="70" cy="70" r="60"/>
                    </svg>
                    <div class="value">
                        <span id="progress-value">0%</span>
                        <span>Progress</span>
                    </div>
                </div>
                <div class="progress-message">
                    <h3>YOUR PROGRESS IS</h3>
                    <p id="progress-msg">Keep going!</p>
                </div>
            </div>

            <div class="detail-actions">
                <button id="detail-edit-btn" class="btn btn-pink btn-sm">✏️ Edit Task</button>
                <button id="detail-fav-btn" class="btn btn-outline btn-sm">☆ Favourite</button>
                <button id="detail-complete-btn" class="btn btn-outline btn-sm">✅ Mark Complete</button>
                <button id="detail-delete-btn" class="btn btn-danger btn-sm">🗑️ Delete</button>
            </div>
        </div>
    </div>
</div>

<!-- ==================== STATS SCREEN ==================== -->
<div id="stats-screen" class="screen">
    <aside class="sidebar">
        <div class="sidebar-brand"><h1>ZILLA</h1><p>Task Manager</p></div>
        <nav class="sidebar-nav">
            <button class="nav-item" onclick="App.showScreen('dashboard')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/></svg>
                Back to Dashboard
            </button>
        </nav>
    </aside>
    <div class="main-content">
        <div class="main-header">
            <div class="greeting">
                <h2>Productivity Analytics</h2>
                <p>Track your task management performance</p>
            </div>
        </div>

        <div class="stats-overview-grid">
            <div class="stat-box score-box">
                <div class="score-circle">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle class="track" cx="60" cy="60" r="50"/>
                        <circle class="fill" id="overall-score-circle" cx="60" cy="60" r="50"/>
                    </svg>
                    <div class="value">
                        <span id="overall-score">0</span>
                    </div>
                </div>
                <h3>Productivity Score</h3>
                <p>Based on completion, progress, and overdue tasks</p>
            </div>
            
            <div class="stat-box details-box">
                <div class="stat-detail-item">
                    <span class="label">Completion Rate</span>
                    <div class="bar-container"><div class="bar-fill" id="bar-completion" style="width:0%"></div></div>
                    <span class="value" id="val-completion">0%</span>
                </div>
                <div class="stat-detail-item">
                    <span class="label">Tasks Due This Week</span>
                    <span class="value txt-pink" id="val-due-week">0</span>
                </div>
                <div class="stat-detail-item">
                    <span class="label">Overdue Tasks</span>
                    <span class="value txt-danger" id="val-overdue">0</span>
                </div>
            </div>
        </div>

        <div class="stats-charts-grid">
            <div class="stat-box">
                <h3>Tasks by Category</h3>
                <div id="category-chart" class="simple-chart"></div>
            </div>
            <div class="stat-box">
                <h3>Tasks by Priority</h3>
                <div id="priority-chart" class="simple-chart"></div>
            </div>
        </div>
        
        <div class="stat-box full-width">
            <h3>Activity Last 7 Days</h3>
            <div id="activity-chart" class="bar-chart"></div>
        </div>
    </div>
</div>

<!-- ==================== TASK MODAL ==================== -->
<div id="task-modal-overlay" class="modal-overlay">
    <div class="modal">
        <h2 id="modal-title" class="modal-title">New Task</h2>
        <form id="task-modal-form">
            <div class="form-group">
                <label class="form-label" for="task-title-input">Title</label>
                <input class="form-input" type="text" id="task-title-input" placeholder="Task title" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="task-desc-input">Description</label>
                <textarea class="form-input" id="task-desc-input" placeholder="Describe your task..." rows="3"></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="task-category-input">Category</label>
                    <select class="form-select" id="task-category-input">
                        <option value="general">General</option>
                        <option value="school">School</option>
                        <option value="work">Work</option>
                        <option value="personal">Personal</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="task-priority-input">Priority</label>
                    <select class="form-select" id="task-priority-input">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="task-due-input">Due Date</label>
                    <input class="form-input" type="date" id="task-due-input">
                </div>
                <div class="form-group">
                    <label class="form-label">Progress: <span id="task-progress-val">0%</span></label>
                    <input type="range" id="task-progress-input" min="0" max="100" value="0" style="width:100%;accent-color:#e84393;margin-top:8px">
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" id="modal-cancel" class="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" class="btn btn-pink btn-sm">Save Task</button>
            </div>
        </form>
    </div>
</div>

<!-- ==================== CONFIRM DIALOG ==================== -->
<div id="confirm-overlay" class="confirm-overlay">
    <div class="confirm-dialog">
        <h3 id="confirm-title">Are you sure?</h3>
        <p id="confirm-message">This action cannot be undone.</p>
        <div class="confirm-actions">
            <button id="confirm-cancel" class="btn btn-outline btn-sm">Cancel</button>
            <button id="confirm-ok" class="btn btn-danger btn-sm">Delete</button>
        </div>
    </div>
</div>

</body>
</html>
