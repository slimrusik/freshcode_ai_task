// ToDo List — backend (просунутий рівень)
// Зберігання завдань у файлі server даних (data/todos.json)

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

async function readTodos() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw || '[]');
}

async function writeTodos(todos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// GET /api/todos — отримати всі завдання
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося прочитати завдання' });
  }
});

// POST /api/todos — додати нове завдання
app.post('/api/todos', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Текст завдання не може бути порожнім' });
  }
  try {
    const todos = await readTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    todos.push(newTodo);
    await writeTodos(todos);
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося додати завдання' });
  }
});

// PATCH /api/todos/:id — оновити (позначити виконаним / редагувати текст)
app.patch('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { completed, text } = req.body;
  try {
    const todos = await readTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Завдання не знайдено' });

    if (typeof completed === 'boolean') todos[idx].completed = completed;
    if (typeof text === 'string' && text.trim()) todos[idx].text = text.trim();

    await writeTodos(todos);
    res.json(todos[idx]);
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося оновити завдання' });
  }
});

// DELETE /api/todos/:id — видалити завдання
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const todos = await readTodos();
    const filtered = todos.filter(t => t.id !== id);
    if (filtered.length === todos.length) {
      return res.status(404).json({ error: 'Завдання не знайдено' });
    }
    await writeTodos(filtered);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Не вдалося видалити завдання' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
