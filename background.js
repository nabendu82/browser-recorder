// Service worker: keeps recording state, routes start/stop, saves finished files.

const OFFSCREEN_URL = 'offscreen.html';

async function getState() {
  return (await chrome.storage.session.get('rec')).rec || null;
}

async function setState(rec) {
  if (rec) await chrome.storage.session.set({ rec });
  else await chrome.storage.session.remove('rec');
  await chrome.action.setBadgeBackgroundColor({ color: '#d93025' });
  await chrome.action.setBadgeText({ text: rec ? 'REC' : '' });
}

async function ensureOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ['USER_MEDIA'],
    justification: 'Record the tab video and audio',
  });
}

async function closeOffscreen() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
  if (existing.length) await chrome.offscreen.closeDocument();
}

async function handle(msg, sender) {
  switch (msg.type) {
    case 'start-tab': {
      if (await getState()) throw new Error('Already recording.');
      await ensureOffscreen();
      const sessionId = crypto.randomUUID();
      try {
        // Obtain the ID in the worker so the offscreen document can consume it.
        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: msg.tabId });
        const res = await chrome.runtime.sendMessage({
          target: 'offscreen', type: 'start', streamId, mic: msg.mic, sessionId,
        });
        if (!res?.ok) throw new Error(res?.error || 'The recorder did not start.');
      } catch (err) {
        await closeOffscreen();
        throw err;
      }
      await setState({ mode: 'tab', startedAt: Date.now(), tabId: msg.tabId, sessionId });
      return { ok: true };
    }

    case 'start-screen': {
      if (await getState()) throw new Error('Already recording.');
      await chrome.tabs.create({ url: `recorder.html?mic=${msg.mic ? 1 : 0}` });
      return { ok: true };
    }

    // Reserve the recording after the user picks a surface, before MediaRecorder starts.
    case 'recorder-started':
      if (await getState()) throw new Error('Already recording. Stop the current recording first.');
      if (!sender.tab?.id || !msg.sessionId) throw new Error('Invalid recorder session.');
      await setState({ mode: 'screen', startedAt: Date.now(), tabId: sender.tab.id, sessionId: msg.sessionId });
      return { ok: true };

    case 'stop': {
      const rec = await getState();
      if (!rec) return { ok: true };
      if (rec.mode === 'tab') {
        await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' });
      } else {
        const res = await chrome.runtime.sendMessage({
          target: 'recorder', type: 'stop', sessionId: rec.sessionId,
        });
        if (!res?.ok) throw new Error('Open the recorder tab to stop and save the recording.');
      }
      return { ok: true };
    }

    case 'recording-stopped': {
      const rec = await getState();
      if (rec?.sessionId === msg.sessionId) await setState(null);
      return { ok: true };
    }

    // Offscreen documents can't use chrome.downloads, so they hand us a blob URL.
    case 'download': {
      const id = await chrome.downloads.download({ url: msg.url, filename: msg.filename });
      const onChanged = async (delta) => {
        if (delta.id !== id || !delta.state || delta.state.current === 'in_progress') return;
        chrome.downloads.onChanged.removeListener(onChanged);
        if (!(await getState())) await closeOffscreen();
      };
      chrome.downloads.onChanged.addListener(onChanged);
      return { ok: true };
    }
  }
}

// Serialize state transitions so two recorder pages cannot both claim the recorder.
let requests = Promise.resolve();
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== 'background') return;
  requests = requests.then(() => handle(msg, sender));
  requests.then(sendResponse, (err) => sendResponse({ error: err.message }));
  requests = requests.catch(() => {});
  return true;
});

// If the screen-recorder tab is closed mid-recording, clear the badge.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const rec = await getState();
  if (rec?.mode === 'screen' && rec.tabId === tabId) await setState(null);
});
