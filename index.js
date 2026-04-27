const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const BASE = 'https://my-lost-and-found-api.onrender.com/items';

app.use(cors());
app.use(express.json());
app.use(express.static('FrontEnd'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/FrontEnd/index.html');
});

app.get('/items', async (req, res) => {
  try {
    const url = req.query.search
      ? `${BASE}?search=${encodeURIComponent(req.query.search)}`
      : BASE;
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/items', async (req, res) => {
  try {
    const response = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/items/:id', async (req, res) => {
  try {
    const response = await fetch(`${BASE}/${req.params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/items/:id', async (req, res) => {
  try {
    const response = await fetch(`${BASE}/${req.params.id}`, {
      method: 'DELETE',
    });
    res.status(response.status).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
