const App = {
  user: null,
  tasks: [],
  currentScreen: 'welcome',
  currentFilter: 'all',
  currentCategory: 'all',
  searchQuery: '',
  currentTaskId: null,
  csrfToken: document.querySelector('meta[name="csrf-token"]')?.content,

  async init() {
    this.bindEvents();
    this.loadTheme();
    try {
      const res = await this.api('GET', '/api/user');
      if (res.success) { this.user = res.user; this.showScreen('dashboard'); }
      else this.showScreen('welcome');
    } catch { this.showScreen('welcome'); }
  },

  async api(method, url, body = null) {
    const opts = { method, headers: { 'Content-Type':'application/json', 'Accept':'application/json', 'X-CSRF-TOKEN': this.csrfToken }, credentials:'same-origin' };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);

    // CSRF token expired — refresh and retry once
    if (r.status === 419) {
      await this.refreshCsrf();
      opts.headers['X-CSRF-TOKEN'] = this.csrfToken;
      const retry = await fetch(url, opts);
      if (retry.status === 401) {
        this.handleSessionExpired();
        throw new Error('Session expired. Please login again.');
      }
      const data = await retry.json();
      if (!retry.ok) throw new Error(data.message || 'Request failed');
      return data;
    }

    // Session expired — redirect to login
    if (r.status === 401) {
      if (url !== '/api/user') {
        this.handleSessionExpired();
        throw new Error('Session expired. Please login again.');
      }
      const data = await r.json();
      throw new Error(data.message || 'Not authenticated');
    }

    const data = await r.json();
    if (!r.ok) {
      let msg = data.message || '';
      if (data.errors) msg = Object.values(data.errors).flat().join(', ');
      throw new Error(msg || 'Request failed');
    }
    return data;
  },

  handleSessionExpired() {
    this.user = null;
    this.tasks = [];
    this.showScreen('welcome');
    this.showToast('Session expired. Please login again.', 'error');
  },

  async refreshCsrf() {
    try {
      const res = await fetch('/api/csrf', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.token) {
        this.csrfToken = data.token;
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) meta.setAttribute('content', data.token);
      }
    } catch {
      // Fallback: parse from HTML
      const res = await fetch('/', { credentials: 'same-origin' });
      const html = await res.text();
      const match = html.match(/csrf-token.*?content="([^"]+)"/);
      if (match) this.csrfToken = match[1];
    }
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(name + '-screen');
    if (el) { el.classList.add('active'); this.currentScreen = name; }
    if (name === 'dashboard' || name === 'stats') this.loadDashboard();
  },

  showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; setTimeout(() => t.remove(), 300); }, 3000);
  },

  // ===== CONFIRM DIALOG =====
  confirm(title, message, okText = 'Delete') {
    return new Promise(resolve => {
      const overlay = document.getElementById('confirm-overlay');
      document.getElementById('confirm-title').textContent = title;
      document.getElementById('confirm-message').textContent = message;
      document.getElementById('confirm-ok').textContent = okText;
      overlay.classList.add('active');
      const ok = document.getElementById('confirm-ok');
      const cancel = document.getElementById('confirm-cancel');
      const cleanup = (result) => { overlay.classList.remove('active'); ok.replaceWith(ok.cloneNode(true)); cancel.replaceWith(cancel.cloneNode(true)); resolve(result); };
      ok.addEventListener('click', () => cleanup(true), { once: true });
      cancel.addEventListener('click', () => cleanup(false), { once: true });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); }, { once: true });
    });
  },

  bindEvents() {
    // Welcome
    document.getElementById('btn-get-started')?.addEventListener('click', () => this.showScreen('auth'));
    document.getElementById('btn-welcome-login')?.addEventListener('click', () => { this.showScreen('auth'); this.toggleAuthMode('login'); });
    document.getElementById('btn-learn-more')?.addEventListener('click', () => this.showScreen('auth'));

    // Auth toggle
    document.getElementById('toggle-to-register')?.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode('register'); });
    document.getElementById('toggle-to-login')?.addEventListener('click', (e) => { e.preventDefault(); this.toggleAuthMode('login'); });

    // Auth submit
    document.getElementById('auth-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleAuth(); });

    // Sidebar nav
    document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.view;
        this.renderTasks();
      });
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => this.handleLogout());

    // Add task
    document.getElementById('btn-add-task')?.addEventListener('click', () => this.openTaskModal());
    document.getElementById('task-modal-form')?.addEventListener('submit', (e) => { e.preventDefault(); this.handleTaskSubmit(); });
    document.getElementById('modal-cancel')?.addEventListener('click', () => this.closeModal());
    document.getElementById('task-modal-overlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) this.closeModal(); });

    // Detail back
    document.getElementById('detail-back-btn')?.addEventListener('click', () => this.showScreen('dashboard'));

    // Search
    document.getElementById('search-input')?.addEventListener('input', (e) => { this.searchQuery = e.target.value; this.renderTasks(); });

    // Detail actions
    document.getElementById('detail-edit-btn')?.addEventListener('click', () => this.editCurrentTask());
    document.getElementById('detail-delete-btn')?.addEventListener('click', () => this.deleteCurrentTask());
    document.getElementById('detail-fav-btn')?.addEventListener('click', () => this.toggleFavCurrentTask());
    document.getElementById('detail-complete-btn')?.addEventListener('click', () => this.toggleCompleteCurrentTask());

    // Tab buttons
    document.querySelectorAll('.tab-btn[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn[data-cat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentCategory = btn.dataset.cat;
        this.renderTasks();
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        document.getElementById('confirm-overlay')?.classList.remove('active');
      }
      if (e.ctrlKey && e.key === 'n' && this.currentScreen === 'dashboard') {
        e.preventDefault();
        this.openTaskModal();
      }
    });

    // Theme switcher
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
    });
  },

  toggleAuthMode(mode) {
    const f = document.getElementById('auth-form');
    const title = document.getElementById('auth-title');
    const nameGroup = document.getElementById('name-group');
    const confirmGroup = document.getElementById('confirm-group');
    const submitBtn = document.getElementById('auth-submit');
    const toggleLogin = document.getElementById('auth-toggle-login');
    const toggleRegister = document.getElementById('auth-toggle-register');

    if (mode === 'register') {
      f.dataset.mode = 'register';
      title.textContent = 'CREATE ACCOUNT';
      nameGroup.style.display = 'block';
      confirmGroup.style.display = 'block';
      submitBtn.textContent = 'SIGN UP';
      toggleLogin.style.display = 'block';
      toggleRegister.style.display = 'none';
    } else {
      f.dataset.mode = 'login';
      title.textContent = 'LOGIN';
      nameGroup.style.display = 'none';
      confirmGroup.style.display = 'none';
      submitBtn.textContent = 'LOGIN';
      toggleLogin.style.display = 'none';
      toggleRegister.style.display = 'block';
    }
  },

  async handleAuth() {
    const form = document.getElementById('auth-form');
    const mode = form.dataset.mode || 'login';
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit');
    btn.disabled = true; btn.textContent = 'Please wait...';

    try {
      if (mode === 'register') {
        const name = document.getElementById('auth-name').value;
        const password_confirmation = document.getElementById('auth-password-confirm').value;
        const res = await this.api('POST', '/api/register', { name, email, password, password_confirmation });
        this.user = res.user;
        await this.refreshCsrf();
        this.showToast('Account created! Welcome to ZILLA!');
      } else {
        const res = await this.api('POST', '/api/login', { email, password });
        this.user = res.user;
        await this.refreshCsrf();
        this.showToast('Welcome back, ' + this.user.name + '!');
      }
      this.showScreen('dashboard');
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = mode === 'register' ? 'SIGN UP' : 'LOGIN';
    }
  },

  async handleLogout() {
    const ok = await this.confirm('Logout', 'Are you sure you want to logout?', 'Logout');
    if (!ok) return;
    try {
      await this.api('POST', '/api/logout');
      this.user = null; this.tasks = [];
      this.showScreen('welcome');
      this.showToast('Logged out successfully', 'info');
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  async loadDashboard() {
    if (!this.user) return;
    document.getElementById('greeting-name').textContent = 'Hello ' + this.user.name + '!!';
    document.getElementById('sidebar-user-name').textContent = this.user.name;
    document.getElementById('sidebar-user-email').textContent = this.user.email;
    try {
      const [taskRes, statRes] = await Promise.all([
        this.api('GET', '/api/tasks'),
        this.api('GET', '/api/tasks/stats')
      ]);
      this.tasks = taskRes.tasks;
      this.renderStats(statRes.stats);
      this.renderTasks();
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  renderStats(s) {
    this.animateNumber('stat-total', s.total);
    this.animateNumber('stat-progress', s.in_progress);
    this.animateNumber('stat-completed', s.completed);
    document.getElementById('stat-avg').textContent = s.average_progress + '%';

    // Update detailed stats if we're on the stats screen or when data loads
    this.renderDetailedStats(s);
  },

  renderDetailedStats(s) {
    // Productivity Score
    const score = s.productivity_score || 0;
    this.animateNumber('overall-score', score);
    const scoreCircle = document.getElementById('overall-score-circle');
    if (scoreCircle) {
      const circ = 2 * Math.PI * 50;
      const offset = circ - (score / 100) * circ;
      scoreCircle.style.setProperty('--circumference', circ);
      scoreCircle.style.setProperty('--offset', offset);
      scoreCircle.setAttribute('stroke-dasharray', circ);
      scoreCircle.setAttribute('stroke-dashoffset', circ);
      requestAnimationFrame(() => {
        scoreCircle.style.transition = 'stroke-dashoffset 1.5s ease';
        scoreCircle.setAttribute('stroke-dashoffset', offset);
      });
    }

    // Detail Items
    const barComp = document.getElementById('bar-completion');
    if (barComp) barComp.style.width = (s.completion_rate || 0) + '%';
    const valComp = document.getElementById('val-completion');
    if (valComp) valComp.textContent = (s.completion_rate || 0) + '%';
    
    const valDue = document.getElementById('val-due-week');
    if (valDue) valDue.textContent = s.due_this_week || 0;
    
    const valOver = document.getElementById('val-overdue');
    if (valOver) valOver.textContent = s.overdue || 0;

    // Charts
    this.renderCategoryChart(s.categories || {});
    this.renderPriorityChart(s.priorities || {});
    this.renderActivityChart(s.weekly_activity || []);
  },

  renderCategoryChart(categories) {
    const container = document.getElementById('category-chart');
    if (!container) return;
    const total = Object.values(categories).reduce((a, b) => a + b, 0);
    if (total === 0) {
      container.innerHTML = '<p class="empty-chart">No data yet</p>';
      return;
    }
    
    let html = '';
    const colors = { 'general': '#9b59b6', 'school': '#3498db', 'work': '#e67e22', 'personal': '#2ecc71' };
    for (const [cat, count] of Object.entries(categories)) {
      const pct = Math.round((count / total) * 100);
      const color = colors[cat] || '#e84393';
      html += `
        <div class="chart-row">
          <span class="chart-label">${this.escHtml(cat)}</span>
          <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%;background:${color}"></div></div>
          <span class="chart-val">${count}</span>
        </div>
      `;
    }
    container.innerHTML = html;
  },

  renderPriorityChart(priorities) {
    const container = document.getElementById('priority-chart');
    if (!container) return;
    const total = Object.values(priorities).reduce((a, b) => a + b, 0);
    if (total === 0) {
      container.innerHTML = '<p class="empty-chart">No data yet</p>';
      return;
    }

    let html = '';
    const colors = { 'low': '#2ecc71', 'medium': '#f39c12', 'high': '#e74c3c' };
    for (const [pri, count] of Object.entries(priorities)) {
      const pct = Math.round((count / total) * 100);
      const color = colors[pri] || '#e84393';
      html += `
        <div class="chart-row">
          <span class="chart-label">${this.escHtml(pri)}</span>
          <div class="chart-bar-wrap"><div class="chart-bar" style="width:${pct}%;background:${color}"></div></div>
          <span class="chart-val">${count}</span>
        </div>
      `;
    }
    container.innerHTML = html;
  },

  renderActivityChart(activity) {
    const container = document.getElementById('activity-chart');
    if (!container) return;
    if (!activity.length) {
      container.innerHTML = '<p class="empty-chart">No activity data</p>';
      return;
    }

    const maxVal = Math.max(...activity.flatMap(a => [a.created, a.completed]), 1);
    
    let html = '<div class="activity-bars">';
    for (const day of activity) {
      const cHeight = (day.created / maxVal) * 100;
      const dHeight = (day.completed / maxVal) * 100;
      html += `
        <div class="activity-col" title="${day.date} - Created: ${day.created}, Completed: ${day.completed}">
          <div class="activity-bars-inner">
            <div class="a-bar a-created" style="height:${cHeight}%"></div>
            <div class="a-bar a-completed" style="height:${dHeight}%"></div>
          </div>
          <span class="a-label">${day.day}</span>
        </div>
      `;
    }
    html += '</div>';
    html += `
      <div class="activity-legend">
        <span class="l-item"><span class="l-dot created"></span> Created</span>
        <span class="l-item"><span class="l-dot completed"></span> Completed</span>
      </div>
    `;
    container.innerHTML = html;
  },

  animateNumber(id, target) {
    const el = document.getElementById(id);
    const start = parseInt(el.textContent) || 0;
    if (start === target) { el.textContent = target; return; }
    const duration = 600;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  isDueOverdue(dateStr) {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
  },

  renderTasks() {
    const container = document.getElementById('task-list');
    let filtered = [...this.tasks];

    if (this.currentFilter === 'favourites') filtered = filtered.filter(t => t.is_favourite);
    else if (this.currentFilter === 'completed') filtered = filtered.filter(t => t.is_completed);
    if (this.currentCategory && this.currentCategory !== 'all') filtered = filtered.filter(t => t.category === this.currentCategory);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg><h3>No tasks found</h3><p>Create your first task to get started! (Ctrl+N)</p></div>';
      return;
    }

    container.innerHTML = filtered.map((t, i) => `
      <div class="task-card" data-id="${t.id}" onclick="App.showTaskDetail(${t.id})" style="animation:slideUp ${0.3 + i * 0.05}s ease">
        <div class="task-card-header">
          <span class="task-title">${t.is_completed ? '✅ ' : ''}${this.escHtml(t.title)}</span>
          <button class="task-fav ${t.is_favourite ? 'active' : ''}" onclick="event.stopPropagation();App.toggleFav(${t.id})">${t.is_favourite ? '★' : '☆'}</button>
        </div>
        ${t.description ? `<p class="task-desc">${this.escHtml(t.description)}</p>` : ''}
        ${t.due_date ? `<p class="task-due ${this.isDueOverdue(t.due_date) && !t.is_completed ? 'overdue' : ''}">📅 ${this.formatDate(t.due_date)}${this.isDueOverdue(t.due_date) && !t.is_completed ? ' — Overdue!' : ''}</p>` : ''}
        <div class="task-meta">
          <span class="task-category">${this.escHtml(t.category || 'general')}</span>
          <span class="task-priority ${t.priority}">${t.priority}</span>
          <div class="task-progress-bar">
            <div class="progress-track"><div class="progress-fill" style="width:${t.progress}%"></div></div>
            <span class="progress-text">${t.progress}%</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  async showTaskDetail(id) {
    this.currentTaskId = id;
    try {
      const res = await this.api('GET', '/api/tasks/' + id);
      const t = res.task;
      document.getElementById('detail-title').textContent = t.title;
      document.getElementById('detail-cat').textContent = t.category || 'general';
      document.getElementById('detail-desc').textContent = t.description || 'No description provided.';
      document.getElementById('detail-fav-btn').textContent = t.is_favourite ? '★ Unfavourite' : '☆ Favourite';

      // Due date
      const dueEl = document.getElementById('detail-due');
      if (t.due_date) {
        dueEl.textContent = '📅 Due: ' + this.formatDate(t.due_date);
        dueEl.className = 'task-due' + (this.isDueOverdue(t.due_date) && !t.is_completed ? ' overdue' : '');
      } else { dueEl.textContent = ''; }

      // Complete button
      const compBtn = document.getElementById('detail-complete-btn');
      compBtn.textContent = t.is_completed ? '↩️ Reopen' : '✅ Mark Complete';

      // Progress circle
      const pct = t.progress;
      const circumference = 2 * Math.PI * 60;
      const offset = circumference - (pct / 100) * circumference;
      const circle = document.getElementById('progress-circle');
      circle.style.setProperty('--circumference', circumference);
      circle.style.setProperty('--offset', offset);
      circle.setAttribute('stroke-dasharray', circumference);
      circle.setAttribute('stroke-dashoffset', circumference);
      requestAnimationFrame(() => {
        circle.style.transition = 'stroke-dashoffset 1.5s ease';
        circle.setAttribute('stroke-dashoffset', offset);
      });
      document.getElementById('progress-value').textContent = pct + '%';

      let msg = 'Keep going!';
      if (pct >= 100) msg = 'Perfect! You nailed it! 🎉';
      else if (pct >= 90) msg = 'Almost there! Amazing work! 🔥';
      else if (pct >= 70) msg = 'Great progress, keep it up! 💪';
      else if (pct >= 50) msg = "You're halfway there! 🚀";
      else if (pct >= 25) msg = 'Good start, keep pushing! ⭐';
      document.getElementById('progress-msg').textContent = msg;

      this.showScreen('detail');
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  openTaskModal(task = null) {
    document.getElementById('task-modal-overlay').classList.add('active');
    document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'New Task';
    const f = document.getElementById('task-modal-form');
    f.dataset.taskId = task ? task.id : '';
    document.getElementById('task-title-input').value = task ? task.title : '';
    document.getElementById('task-desc-input').value = task ? (task.description || '') : '';
    document.getElementById('task-progress-input').value = task ? task.progress : 0;
    document.getElementById('task-progress-val').textContent = (task ? task.progress : 0) + '%';
    document.getElementById('task-category-input').value = task ? (task.category || 'general') : 'general';
    document.getElementById('task-priority-input').value = task ? (task.priority || 'medium') : 'medium';
    document.getElementById('task-due-input').value = task?.due_date ? task.due_date.split('T')[0] : '';
    // Focus title input
    setTimeout(() => document.getElementById('task-title-input')?.focus(), 100);
  },

  closeModal() {
    document.getElementById('task-modal-overlay').classList.remove('active');
  },

  async handleTaskSubmit() {
    const f = document.getElementById('task-modal-form');
    const id = f.dataset.taskId;
    const body = {
      title: document.getElementById('task-title-input').value,
      description: document.getElementById('task-desc-input').value,
      progress: parseInt(document.getElementById('task-progress-input').value),
      category: document.getElementById('task-category-input').value,
      priority: document.getElementById('task-priority-input').value,
      due_date: document.getElementById('task-due-input').value || null,
    };

    // Auto-complete if progress is 100
    if (body.progress >= 100) body.is_completed = true;

    try {
      if (id) { await this.api('PUT', '/api/tasks/' + id, body); this.showToast('Task updated!'); }
      else { await this.api('POST', '/api/tasks', body); this.showToast('Task created! 🎉'); }
      this.closeModal();
      this.loadDashboard();
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  async toggleFav(id) {
    try {
      const res = await this.api('POST', '/api/tasks/' + id + '/favourite');
      // Update local state for instant UI feedback
      const task = this.tasks.find(t => t.id === id);
      if (task) task.is_favourite = !task.is_favourite;
      this.renderTasks();
      this.showToast(res.message, 'info');
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  async editCurrentTask() {
    if (!this.currentTaskId) return;
    const res = await this.api('GET', '/api/tasks/' + this.currentTaskId);
    this.showScreen('dashboard');
    setTimeout(() => this.openTaskModal(res.task), 300);
  },

  async deleteCurrentTask() {
    if (!this.currentTaskId) return;
    const ok = await this.confirm('Delete Task', 'Are you sure you want to delete this task? This cannot be undone.', 'Delete');
    if (!ok) return;
    try {
      await this.api('DELETE', '/api/tasks/' + this.currentTaskId);
      this.showToast('Task deleted!');
      this.showScreen('dashboard');
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  async toggleFavCurrentTask() {
    if (!this.currentTaskId) return;
    try {
      await this.api('POST', '/api/tasks/' + this.currentTaskId + '/favourite');
      this.showTaskDetail(this.currentTaskId);
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  async toggleCompleteCurrentTask() {
    if (!this.currentTaskId) return;
    try {
      const res = await this.api('GET', '/api/tasks/' + this.currentTaskId);
      const t = res.task;
      const newStatus = !t.is_completed;
      await this.api('PUT', '/api/tasks/' + this.currentTaskId, {
        is_completed: newStatus,
        progress: newStatus ? 100 : t.progress
      });
      this.showToast(newStatus ? 'Task completed! 🎉' : 'Task reopened');
      this.showTaskDetail(this.currentTaskId);
    } catch (err) { this.showToast(err.message, 'error'); }
  },

  // ===== THEME SWITCHER =====
  setTheme(theme) {
    document.body.classList.remove('theme-emerald', 'theme-ice', 'theme-synthwave');
    if (theme && theme !== 'magenta') {
      document.body.classList.add('theme-' + theme);
    }
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    localStorage.setItem('zilla-theme', theme);
  },

  loadTheme() {
    const saved = localStorage.getItem('zilla-theme') || 'magenta';
    this.setTheme(saved);
  },

  escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;

// Progress slider live update
document.addEventListener('input', (e) => {
  if (e.target.id === 'task-progress-input') {
    document.getElementById('task-progress-val').textContent = e.target.value + '%';
  }
});
