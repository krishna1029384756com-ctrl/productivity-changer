// ---------- Helper ----------
const $ = (id) => document.getElementById(id);
const storage = {
  get: (keys) => new Promise(r => chrome.storage.local.get(keys, r)),
  set: (obj) => new Promise(r => chrome.storage.local.set(obj, r)),
};

// ---------- To-Do List ----------
async function loadTasks() {
  const { tasks = [] } = await storage.get('tasks');
  const list = $('taskList');
  list.innerHTML = '';
  tasks.forEach((task, i) => {
    const li = document.createElement('li');
    if (task.done) li.classList.add('done');
    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} data-i="${i}">
      <span>${task.text}</span>
      <button data-del="${i}">×</button>`;
    list.appendChild(li);
  });
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
  if (e.target.type === 'checkbox') {
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

// ---------- Quick Notes ----------
const notesEl = $('notes');
storage.get('notes').then(({ notes = '' }) => notesEl.value = notes);
notesEl.addEventListener('input', () => {
  chrome.storage.local.set({ notes: notesEl.value });
});

// ---------- Pomodoro Timer ----------
let timeLeft = 25 * 60;
let running = false;
let intervalId = null;

function renderTimer() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  $('timer').textContent = `${m}:${s}`;
}

function startTimer() {
  if (running) {
    clearInterval(intervalId);
    running = false;
    $('startTimer').textContent = 'Start';
    $('timerStatus').textContent = 'Paused';
    return;
  }
  running = true;
  $('startTimer').textContent = 'Pause';
  $('timerStatus').textContent = 'Focusing...';
  intervalId = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      running = false;
      $('startTimer').textContent = 'Start';
      $('timerStatus').textContent = 'Break time! 🎉';
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: 'Pomodoro Done',
        message: 'Take a 5 minute break!'
      });
      timeLeft = 25 * 60;
      renderTimer();
    }
  }, 1000);
}

$('startTimer').onclick = startTimer;
$('resetTimer').onclick = () => {
  clearInterval(intervalId);
  running = false;
  timeLeft = 25 * 60;
  renderTimer();
  $('startTimer').textContent = 'Start';
  $('timerStatus').textContent = 'Focus session ready';
};

// ---------- Tab Tools ----------
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

$('openOptions').onclick = () => chrome.runtime.openOptionsPage();

// ---------- Init ----------
renderTimer();
loadTasks();