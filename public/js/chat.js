const messagesEl = document.getElementById('messages');
const form = document.getElementById('form');
const input = document.getElementById('input');
const sendBtn = document.getElementById('send');

// Update this to a real contact channel for your support team.
const SUPPORT_URL = 'mailto:support@example.com';

// Small avatars reused per message.
const BOT_AVATAR = '<img class="avatar-sm" src="assets/bot-avatar.svg" alt="" />';
const USER_AVATAR = '<img class="avatar-sm" src="assets/user-avatar.svg" alt="" />';

function makeRow(role) {
  const row = document.createElement('div');
  row.className = `row ${role}`;
  if (role === 'user') {
    row.innerHTML = USER_AVATAR;
  } else {
    row.innerHTML = BOT_AVATAR; // bot + error both get the bot avatar
  }
  return row;
}

function addMessage(text, role) {
  const row = makeRow(role);
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollToBottom();
  return row;
}

function addHandoffButton() {
  const wrap = document.createElement('div');
  wrap.className = 'handoff';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.innerHTML = '🙋 Contact human support';
  btn.addEventListener('click', () => { window.location.href = SUPPORT_URL; });
  wrap.appendChild(btn);
  messagesEl.appendChild(wrap);
  scrollToBottom();
}

function showTyping() {
  const row = makeRow('bot');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  scrollToBottom();
  return row;
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function sendMessage(message) {
  const typingEl = showTyping();
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    typingEl.remove();

    if (!res.ok) {
      addMessage(data.error || 'Something went wrong.', 'error');
      return;
    }

    addMessage(data.answer, 'bot');
    if (data.handoff) addHandoffButton();
  } catch (err) {
    typingEl.remove();
    addMessage('Network error — please try again.', 'error');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, 'user');
  input.value = '';
  input.focus();
  sendBtn.disabled = true;

  await sendMessage(message);
  sendBtn.disabled = false;
});

// Footer: wire Contact to the support channel; Settings/FAQ are demo links.
document.getElementById('contact-link').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = SUPPORT_URL;
});

// Greeting
addMessage('Hi! How can I help you today?\nAsk me anything about our product/service.', 'bot');
