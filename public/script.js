// ToDo List — просунутий рівень (дані зберігаються на сервері через REST API)

const API_URL = '/api/todos';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const countEl = document.getElementById('todo-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');

let todos = [];
let currentFilter = 'all';

async function fetchTodos() {
  const res = await fetch(API_URL);
  todos = await res.json();
  render();
}

async function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed }),
  });
  const newTodo = await res.json();
  todos.push(newTodo);
  render();
}

async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: !todo.completed }),
  });
  const updated = await res.json();
  todos = todos.map(t => t.id === id ? updated : t);
  render();
}

async function deleteTodo(id) {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  todos = todos.filter(t => t.id !== id);
  render();
}

async function clearCompleted() {
  const completed = todos.filter(t => t.completed);
  await Promise.all(completed.map(t => fetch(`${API_URL}/${t.id}`, { method: 'DELETE' })));
  todos = todos.filter(t => !t.completed);
  render();
}

function render() {
  list.innerHTML = '';

  const filtered = todos.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  filtered.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = todo.text;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    li.append(checkbox, span, deleteBtn);
    list.appendChild(li);
  });

  const activeCount = todos.filter(t => !t.completed).length;
  countEl.textContent = `${activeCount} завдань залишилось`;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  addTodo(input.value);
  input.value = '';
  input.focus();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

fetchTodos();
