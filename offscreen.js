// Tab mode: records the captured tab (video + tab audio, optionally mic) in the background.

let recorder = null;
let streams = [];
let audio = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'offscreen') return;
  if (msg.type === 'start') {
    start(msg).then(
      () => sendResponse({ ok: true }),
      (err) => { cleanup(); sendResponse({ error: err.message || String(err) }); },
    );
    return true;
  }
  if (msg.type === 'stop') {
    stop();
    sendResponse({ ok: true });
  }
});

async function start({ streamId, mic }) {
  const tab = await navigator.mediaDevices.getUserMedia({
    audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
    video: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 60,
      },
    },
  });
  streams = [tab];

  if (mic) {
    streams.push(await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    }));
  }

  // Tab capture silences the tab, so route its audio back to the speakers too.
  audio = mixAudio(streams, tab);
  const out = new MediaStream([...tab.getVideoTracks(), ...audio.tracks]);

  // Tab closed → finish the recording.
  tab.getVideoTracks()[0].addEventListener('ended', stop);

  recorder = startRecorder(out, async (blob, filename) => {
    const url = URL.createObjectURL(blob);
    cleanup();
    await chrome.runtime.sendMessage({ target: 'background', type: 'recording-stopped' });
    await chrome.runtime.sendMessage({ target: 'background', type: 'download', url, filename });
  });
}

function stop() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

function cleanup() {
  streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
  streams = [];
  audio?.ctx.close();
  audio = null;
  recorder = null;
}
