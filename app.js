const today = new Date();
let currentDate = today;

const dayView = document.getElementById('day-view');
const monthView = document.getElementById('month-view');
const yearView = document.getElementById('year-view');

const dayTitle = document.getElementById('day-title');
const monthTitle = document.getElementById('month-title');
const yearTitle = document.getElementById('year-title');

const taskList = document.getElementById('task-list');

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function loadTasks(dateStr) {
  const data = localStorage.getItem(`day:${dateStr}`);
  return data ? JSON.parse(data) : [];
}

function saveTasks(dateStr, tasks) {
  localStorage.setItem(`day:${dateStr}`, JSON.stringify(tasks));
}

function renderDay() {
  const dateStr = formatDate(currentDate);
  dayTitle.textContent = dateStr;
  const tasks = loadTasks(dateStr);
  taskList.innerHTML = '';
  tasks.forEach((t, i) => {
    const li = document.createElement('li');
    const left = document.createElement('span');
    left.textContent = t.title;
    const pri = document.createElement('span');
    pri.className = `priority priority-${t.priority || 2}`;
    li.prepend(pri);
    li.appendChild(left);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.addEventListener('change', () => {
      t.done = cb.checked;
      tasks[i] = t;
      saveTasks(dateStr, tasks);
    });
    li.appendChild(cb);
    taskList.appendChild(li);
  });
}

function renderMonth() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthTitle.textContent = `${year} - ${month + 1}`;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cal = document.getElementById('calendar');
  cal.innerHTML = '';
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = formatDate(new Date(year, month, d));
    const dayCell = document.createElement('div');
    dayCell.className = 'day-cell';
    dayCell.textContent = d;
    const tasks = loadTasks(dateStr);
    if (tasks.length) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      dayCell.appendChild(dot);
    }
    dayCell.addEventListener('click', () => {
      currentDate = new Date(year, month, d);
      showView('day');
    });
    cal.appendChild(dayCell);
  }
}

function renderYear() {
  const year = currentDate.getFullYear();
  yearTitle.textContent = `${year}`;
  const container = document.getElementById('year-content');
  container.innerHTML = '';
  for (let m = 0; m < 12; m++) {
    const div = document.createElement('div');
    div.textContent = `${m + 1}月`;
    container.appendChild(div);
  }
}

function showView(v) {
  dayView.classList.add('hidden');
  monthView.classList.add('hidden');
  yearView.classList.add('hidden');
  if (v === 'day') {
    dayView.classList.remove('hidden');
    renderDay();
  } else if (v === 'month') {
    monthView.classList.remove('hidden');
    renderMonth();
  } else {
    yearView.classList.remove('hidden');
    renderYear();
  }
}

function parseInput(text) {
  const tomorrowRegex = /^明天/;
  let date = new Date(currentDate);
  if (tomorrowRegex.test(text)) {
    date.setDate(date.getDate() + 1);
    text = text.replace(tomorrowRegex, '').trim();
  }
  const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    date = new Date(dateMatch[1]);
    text = text.replace(dateMatch[1], '').trim();
  }
  return { title: text.trim(), date };
}

function quickAdd() {
  const input = document.getElementById('quick-input');
  const { title, date } = parseInput(input.value);
  if (!title) return;
  const dateStr = formatDate(date);
  const tasks = loadTasks(dateStr);
  tasks.push({ id: Date.now(), title, date: dateStr, priority: 2, done: false });
  saveTasks(dateStr, tasks);
  input.value = '';
  currentDate = date;
  renderDay();
}

document.getElementById('quick-add-btn').addEventListener('click', quickAdd);

document.getElementById('view-day-btn').addEventListener('click', () => showView('day'));
document.getElementById('view-month-btn').addEventListener('click', () => showView('month'));
document.getElementById('view-year-btn').addEventListener('click', () => showView('year'));

// keyboard shortcuts
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'n' || e.key === 'N') {
    document.getElementById('quick-input').focus();
    e.preventDefault();
  }
  if (e.key === 'd' || e.key === 'D') showView('day');
  if (e.key === 'm' || e.key === 'M') showView('month');
  if (e.key === 'y' || e.key === 'Y') showView('year');
  if (e.key === 'ArrowLeft') {
    currentDate.setDate(currentDate.getDate() - 1);
    renderDay();
  }
  if (e.key === 'ArrowRight') {
    currentDate.setDate(currentDate.getDate() + 1);
    renderDay();
  }
});

showView('day');
