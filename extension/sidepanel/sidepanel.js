// Side panel logic – minimal, personal

(function () {
  const focusToggle = document.getElementById('pc-focus-toggle');
  const openBlockerBtn = document.getElementById('pc-open-blocker');
  const timerDisplay = document.getElementById('pc-timer-display');
  const timerStartBtn = document.getElementById('pc-timer-start');
  const timerResetBtn = document.getElementById('pc-timer-reset');
  const taskInput = document.getElementById('pc-task-input');
  const taskList = document.getElementById('pc-task-list');
  const notesArea = document.getElementById('pc-notes');

  let timerInterval = null;
  let timeLeft = 25 * 60; // seconds
  let running = false;

  // Placeholder for your Netlify blocker domain
  const BLOCKER_URL = 'https://YOUR_BLOCKER_DOMAIN.netlify.app';

  // Load saved state
  chrome.storage.local.get(
    ['focusMode', 'tasks', 'notes', 'timerSeconds', 'timerRunning'],
    (data) => {
      if (typeof data.focusMode === 'boolean') {
        focusToggle.checked = data.focusMode;
      }
      if (Array.isArray(data.tasks)) {
        renderTasks(data.tasks);
      }
      if (typeof data.notes === 'string') {
        notesArea.value = data.notes;
      }
      if (typeof data.timerSeconds === 'number') {
        timeLeft = data.timerSeconds;
        updateTimerDisplay();
      }
      if (data.timerRunning) {
        running = true;
        timerStartBtn.textContent = 'Pause';
        startTimer();
      }
    }
  );

  // Focus toggle
  focusToggle.addEventListener('change', () => {
    const enabled = focusToggle.checked;
    chrome.storage.local.set({ focusMode: enabled });
    // Later: send message to background/content to actually enable blocker+darkmode
  });

  // Open blocker dashboard
  openBlockerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: BLOCKER_URL });
  });

  // Timer
  function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
  }

  function startTimer() {
    if (running) return;
    running = true;
    timerStartBtn.textContent = 'Pause';
    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
        chrome.storage.local.set({ timerSeconds: timeLeft, timerRunning: true });
      } else {
        stopTimer();
      }
    }, 1000);
  }

  function stopTimer() {
    running = false;
    timerStartBtn.textContent = 'Start';
    clearInterval(timerInterval);
    chrome.storage.local.set({ timerRunning: false });
  }

  timerStartBtn.addEventListener('click', () => {
    if (running) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  timerResetBtn.addEventListener('click', () => {
    stopTimer();
    timeLeft = 25 * 60;
    updateTimerDisplay();
    chrome.storage.local.set({ timerSeconds: timeLeft, timerRunning: false });
  });

  // Tasks
  function saveTasks(tasks) {
    chrome.storage.local.set({ tasks });
  }

  function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach((task, idx) => {
      const row = document.createElement('div');
      row.className = 'pc-task-item' + (task.done ? ' pc-task-done' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      const text = document.createElement('div');
      text.className = 'pc-task-text';
      text.textContent = task.text;

      const del = document.createElement('button');
      del.className = 'pc-task-delete';
      del.textContent = '🗑';
      del.title = 'Delete';
      del.addEventListener('click', () => {
        tasks.splice(idx, 1);
        saveTasks(tasks);
        renderTasks(tasks);
      });

      row.appendChild(checkbox);
      row.appendChild(text);
      row.appendChild(del);
      taskList.appendChild(row);
    });
  }

  taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && taskInput.value.trim()) {
      const text = taskInput.value.trim();
      chrome.storage.local.get(['tasks'], (data) => {
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        tasks.push({ id: Date.now(), text, done: false });
        saveTasks(tasks);
        renderTasks(tasks);
        taskInput.value = '';
      });
    }
  });

  // Notes auto-save
  let notesSaveTimeout = null;
  notesArea.addEventListener('input', () => {
    clearTimeout(notesSaveTimeout);
    notesSaveTimeout = setTimeout(() => {
      chrome.storage.local.set({ notes: notesArea.value });
    }, 400);
  });
})();
