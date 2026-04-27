const BASE = 'https://my-lost-and-found-api.onrender.com/items';
let allItems = [];

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['browse', 'report'][i] === name);
  });
  document
    .querySelectorAll('.section')
    .forEach((s) => s.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'browse') loadItems();
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.style.display = 'block';
  setTimeout(() => (t.style.display = 'none'), 3000);
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadItems(search = '') {
  const list = document.getElementById('items-list');
  list.innerHTML = '<div class="loading">Loading...</div>';
  try {
    const url = search ? `${BASE}?search=${encodeURIComponent(search)}` : BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    allItems = Array.isArray(data) ? data : data.items || [];
    renderItems(allItems);
    updateStats(allItems);
  } catch (e) {
    list.innerHTML =
      '<div class="empty">Could not load items. Check your connection.</div>';
  }
}

function updateStats(items) {
  document.getElementById('stat-total').textContent = items.length;
  document.getElementById('stat-lost').textContent = items.filter(
    (i) => (i.status || '').toLowerCase() === 'lost'
  ).length;
  document.getElementById('stat-found').textContent = items.filter(
    (i) => (i.status || '').toLowerCase() === 'found'
  ).length;
}

function renderItems(items) {
  const list = document.getElementById('items-list');
  if (!items.length) {
    list.innerHTML = '<div class="empty">No items found.</div>';
    return;
  }
  list.innerHTML = items
    .map((item) => {
      const id = item.id ?? item._id;
      const st = (item.status || 'lost').toLowerCase();
      const icon = st === 'found' ? '✅' : '❓';
      const name = esc(item.item || item.name || 'Unnamed item');
      const loc = esc(item.location || 'Unknown location');
      const contact = item.contact ? ` · ${esc(item.contact)}` : '';
      return `
      <div class="item-card" id="card-${id}">
        <div class="item-top">
          <div class="item-icon ${st}">${icon}</div>
          <div class="item-info">
            <div class="item-name">${name}</div>
            <div class="item-meta">${loc}${contact}</div>
          </div>
          <span class="badge ${st}">${esc(item.status || 'Lost')}</span>
        </div>
        <div class="item-actions">
          ${
            st === 'lost'
              ? `<button class="btn-action success" onclick="markFound(${id})">Mark as found</button>`
              : ''
          }
          <button class="btn-action danger" onclick="deleteItem(${id}, '${name}')">Delete</button>
        </div>
      </div>`;
    })
    .join('');
}

let searchTimer;
function handleSearch(val) {
  clearTimeout(searchTimer);
  if (!val) {
    renderItems(allItems);
    return;
  }
  searchTimer = setTimeout(() => loadItems(val), 400);
}

async function markFound(id) {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Found', contact: 'Guard Office' }),
    });
    if (!res.ok) throw new Error();
    showToast('Item marked as found!');
    loadItems();
  } catch (e) {
    showToast('Failed to update item.', 'error');
  }
}

async function deleteItem(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    showToast('Item deleted.');
    loadItems();
  } catch (e) {
    showToast('Failed to delete item.', 'error');
  }
}

async function submitItem() {
  const item = document.getElementById('f-item').value.trim();
  const location = document.getElementById('f-location').value.trim();
  const status = document.getElementById('f-status').value;
  const contact = document.getElementById('f-contact').value.trim();

  if (!item || !location) {
    showToast('Item name and location are required.', 'error');
    return;
  }

  const body = { item, location, status };
  if (contact) body.contact = contact;

  const btn = document.getElementById('submit-btn');
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error();
    showToast('Item reported successfully!');
    document.getElementById('f-item').value = '';
    document.getElementById('f-location').value = '';
    document.getElementById('f-contact').value = '';
    switchTab('browse');
  } catch (e) {
    showToast('Failed to submit. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit report';
  }
}

loadItems();
