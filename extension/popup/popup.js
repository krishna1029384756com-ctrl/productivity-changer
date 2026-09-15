const $ = (id) => document.getElementById(id);
const storage = {
  get: (keys) => new Promise(r => chrome.storage.local.get(keys, r)),
  set: (obj) => new Promise(r => chrome.storage.local.set(obj, r)),
};

// ---------- Theme ----------
async function initTheme() {
  const { theme = 'dark' } = await storage.get('theme');
  document.documentElement.setAttribute('data-theme', theme);
  $('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}
$('themeToggle').onclick = async () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  $('themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
  await storage.set({ theme: next });
};

// ---------- Tasks ----------
async function loadTasks() {
  const { tasks = [] } = await storage.get('tasks');
  const list = $('taskList');
  list.innerHTML = '';
  tasks.forEach((task, i) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} data-i="${i}">
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="task-delete" data-del="${i}">×</button>
    `;
    list.appendChild(li);
  });
  const done = tasks.filter(t => t.done).length;
  $('taskCount').textContent = `${done}/${tasks.length}`;
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

$('addTask').onclick = async () => {
  const text = $('taskInput').value.trim();
  if (!text) return;
  const { tasks = [] } = await storage.get('tasks');
  tasks.push({ text, done: false });
  await storage.set({ tasks });
  $('taskInput').value = '';
  loadTasks();
};
$('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('addTask').click();
});
$('taskList').addEventListener('click', async (e) => {
  const { tasks = [] } = await storage.get('tasks');
  if (e.target.classList.contains('task-checkbox')) {
    tasks[e.target.dataset.i].done = e.target.checked;
    await storage.set({ tasks });
    loadTasks();
  }
  if (e.target.dataset.del !== undefined) {
    tasks.splice(e.target.dataset.del, 1);
    await storage.set({ tasks });
    loadTasks();
  }
});

// ---------- Notes ----------
const notesEl = $('notes');
storage.get('notes').then(({ notes = '' }) => notesEl.value = notes);
let saveTimeout;
notesEl.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await storage.set({ notes: notesEl.value });
    const s = $('noteStatus');
    s.textContent = '✓ Saved';
    s.classList.add('saved');
    setTimeout(() => s.classList.remove('saved'), 1500);
  }, 400);
});

// ---------- Pomodoro with Ring ----------
const TOTAL = 25 * 60;
const CIRC = 2 * Math.PI * 52; // r=52
let timeLeft = TOTAL;
let running = false;
let intervalId = null;

$('ringProgress').style.strokeDasharray = CIRC;

function renderTimer() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  $('timer').textContent = `${m}:${s}`;
  const progress = 1 - timeLeft / TOTAL;
  $('ringProgress').style.strokeDashoffset = CIRC * (1 - progress);
}

function startTimer() {
  if (running) {
    clearInterval(intervalId);
    running = false;
    $('startTimer').textContent = '▶ Resume';
    $('timerStatus').textContent = 'Paused';
    return;
  }
  running = true;
  $('startTimer').textContent = '⏸ Pause';
  $('timerStatus').textContent = 'Focusing';
  intervalId = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      running = false;
      $('startTimer').textContent = '▶ Start';
      $('timerStatus').textContent = 'Break 🎉';
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: 'Pomodoro Complete',
        message: 'Take a 5-minute break!'
      });
      timeLeft = TOTAL;
      renderTimer();
    }
  }, 1000);
}
$('startTimer').onclick = startTimer;
$('resetTimer').onclick = () => {
  clearInterval(intervalId);
  running = false;
  timeLeft = TOTAL;
  renderTimer();
  $('startTimer').textContent = '▶ Start';
  $('timerStatus').textContent = 'Focus';
};

// ---------- Actions ----------
$('closeDupes').onclick = async () => {
  const tabs = await chrome.tabs.query({});
  const seen = new Set();
  for (const t of tabs) {
    if (seen.has(t.url)) chrome.tabs.remove(t.id);
    else seen.add(t.url);
  }
};
$('toggleDark').onclick = async () => {
  const { darkMode = false } = await storage.get('darkMode');
  await storage.set({ darkMode: !darkMode });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { type: 'toggleDark', value: !darkMode });
};
$('focusMode').onclick = () => {
  // Placeholder — will implement in next step
  alert('Focus Mode coming next 🎯');
};
$('openOptions').onclick = () => chrome.runtime.openOptionsPage();

// ---------- Init ----------
initTheme();
renderTimer();
loadTasks();