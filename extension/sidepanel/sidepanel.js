// Productivity Changer – Side Panel (Full Logic)

(function () {
  // Navigation
  const navBtns = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');

  function showView(name) {
    navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === name);
    });
    views.forEach(view => {
      view.classList.toggle('active', view.id === `view-${name}`);
    });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showView(btn.dataset.view);
    });
  });

  // Focus toggle
  const focusToggle = document.getElementById('focus-toggle');
  chrome.storage.local.get(['focusMode'], (data) => {
    if (typeof data.focusMode === 'boolean') {
      focusToggle.checked = data.focusMode;
    }
  });
  focusToggle.addEventListener('change', () => {
    chrome.storage.local.set({ focusMode: focusToggle.checked });
  });

  // Timer
  const timerDisplay = document.getElementById('timer-display');
  const timerStartBtn = document.getElementById('timer-start');
  const timerResetBtn = document.getElementById('timer-reset');

  let timerInterval = null;
  let timeLeft = 25 * 60;
  let running = false;

  function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
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

  chrome.storage.local.get(['timerSeconds', 'timerRunning'], (data) => {
    if (typeof data.timerSeconds === 'number') {
      timeLeft = data.timerSeconds;
      updateTimerDisplay();
    }
    if (data.timerRunning) {
      running = true;
      timerStartBtn.textContent = 'Pause';
      startTimer();
    }
  });

  // Tasks
  const taskInput = document.getElementById('task-input');
  const taskList = document.getElementById('task-list');

  function saveTasks(tasks) {
    chrome.storage.local.set({ tasks });
  }

  function renderTasks(tasks) {
    taskList.innerHTML = '';
    tasks.forEach((task, idx) => {
      const row = document.createElement('div');
      row.className = 'task-item' + (task.done ? ' done' : '');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.done;
      checkbox.addEventListener('change', () => {
        task.done = checkbox.checked;
        saveTasks(tasks);
        renderTasks(tasks);
      });

      const text = document.createElement('div');
      text.className = 'task-text';
      text.textContent = task.text;

      const del = document.createElement('button');
      del.className = 'task-delete';
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

  chrome.storage.local.get(['tasks'], (data) => {
    if (Array.isArray(data.tasks)) {
      renderTasks(data.tasks);
    }
  });

  // Notes
  const notesArea = document.getElementById('notes-area');
  let notesSaveTimeout = null;

  notesArea.addEventListener('input', () => {
    clearTimeout(notesSaveTimeout);
    notesSaveTimeout = setTimeout(() => {
      chrome.storage.local.set({ notes: notesArea.value });
    }, 400);
  });

  chrome.storage.local.get(['notes'], (data) => {
    if (typeof data.notes === 'string') {
      notesArea.value = data.notes;
    }
  });

  // Block button
  const openBlockerBtn = document.getElementById('open-blocker');
  const BLOCKER_URL = 'https://YOUR_BLOCKER_DOMAIN.netlify.app';

  openBlockerBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: BLOCKER_URL });
  });
})();
