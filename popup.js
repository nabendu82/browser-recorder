const $ = (id) => document.getElementById(id);

const HINTS = {
  tab: 'Records the current tab with its sound. You keep hearing the tab while recording.',
  screen: 'Pick a screen, window or tab. Tick “Share audio” in Chrome’s picker to capture sound.',
};

let mode = 'tab';
let timerId = null;

function send(msg) {
  return chrome.runtime.sendMessage({ target: 'background', ...msg });
}

function showError(text) {
  $('error').textContent = text;
  $('error').hidden = !text;
}

function setMode(next) {
  mode = next;
  document.querySelectorAll('.opt').forEach((b) => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', on);
  });
  $('hint').textContent = HINTS[mode];
}

function render(rec) {
  $('idle').hidden = !!rec;
  $('recording').hidden = !rec;
  clearInterval(timerId);
  if (!rec) return;
  const tick = () => {
    const s = Math.floor((Date.now() - rec.startedAt) / 1000);
    const hh = Math.floor(s / 3600);
    const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    $('timer').textContent = hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
  };
  tick();
  timerId = setInterval(tick, 500);
}

async function micReady() {
  const { state } = await navigator.permissions.query({ name: 'microphone' });
  if (state === 'granted') return true;
  // Popups can't show the permission prompt, so ask once from a normal tab.
  await chrome.tabs.create({ url: 'permission.html' });
  window.close();
  return false;
}

async function start() {
  showError('');
  $('start').disabled = true;
  const mic = $('mic').checked;
  try {
    if (mode === 'tab') {
      if (mic && !(await micReady())) return;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });
      const res = await send({ type: 'start-tab', streamId, mic, tabId: tab.id });
      if (res?.error) throw new Error(res.error);
    } else {
      const res = await send({ type: 'start-screen', mic });
      if (res?.error) throw new Error(res.error);
    }
    window.close();
  } catch (err) {
    const msg = err.message || String(err);
    showError(/chrome:\/\/|Chrome pages|cannot be captured/i.test(msg)
      ? 'This page can’t be recorded. Switch to a normal website tab.'
      : msg);
    $('start').disabled = false;
  }
}

document.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => {
  setMode(b.dataset.mode);
  chrome.storage.local.set({ mode });
}));
$('mic').addEventListener('change', () => chrome.storage.local.set({ mic: $('mic').checked }));
$('start').addEventListener('click', start);
$('stop').addEventListener('click', async () => {
  await send({ type: 'stop' });
  window.close();
});

chrome.storage.session.onChanged.addListener((changes) => {
  if (changes.rec) render(changes.rec.newValue || null);
});

(async () => {
  const prefs = await chrome.storage.local.get(['mode', 'mic']);
  setMode(prefs.mode || 'tab');
  $('mic').checked = !!prefs.mic;
  render((await chrome.storage.session.get('rec')).rec || null);
})();
