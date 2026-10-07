// Screen / window mode: runs in a normal extension tab because getDisplayMedia
// needs a visible page to show Chrome's picker.

const $ = (id) => document.getElementById(id);
const wantMic = new URLSearchParams(location.search).get('mic') === '1';
const sessionId = crypto.randomUUID();

let recorder = null;
let streams = [];
let audio = null;
let timerId = null;
let starting = false;

function show(id) {
  for (const s of ['pick', 'recording', 'done']) $(s).hidden = s !== id;
}

async function begin() {
  if (starting || recorder) return;
  starting = true;
  $('choose').disabled = true;
  $('error').hidden = true;
  let display;
  let claimed = false;
  try {
    display = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 60 } },
      audio: true,
      systemAudio: 'include',
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'include',
      monitorTypeSurfaces: 'include',
    });
    streams = [display];

    if (wantMic) {
      try {
        streams.push(await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        }));
      } catch {
        throw new Error('Microphone access failed. Allow access in Chrome, or close this tab and start again with Microphone turned off.');
      }
    }

    const audioStreams = streams.filter((s) => s.getAudioTracks().length);
    let audioTracks = [];
    if (audioStreams.length > 1) {
      audio = mixAudio(audioStreams);
      audioTracks = audio.tracks;
    } else if (audioStreams.length === 1) {
      audioTracks = audioStreams[0].getAudioTracks();
    }

    $('audioNote').textContent = audioTracks.length
      ? 'Recording with sound. You can switch to another window — stop from here or from the toolbar icon.'
      : 'Recording without sound (“Share audio” was off). Stop from here or from the toolbar icon.';

    const out = new MediaStream([...display.getVideoTracks(), ...audioTracks]);
    // Chrome's own "Stop sharing" bar ends the video track.
    display.getVideoTracks()[0].addEventListener('ended', stop);

    const res = await chrome.runtime.sendMessage({ target: 'background', type: 'recorder-started', sessionId });
    if (!res?.ok) throw new Error(res?.error || 'The recorder could not start.');
    claimed = true;
    if (display.getVideoTracks()[0].readyState === 'ended') throw new Error('Screen sharing ended. Choose a screen to try again.');
    recorder = startRecorder(out, finish);
    startTimer();
    show('recording');
  } catch (err) {
    streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
    streams = [];
    audio?.ctx.close();
    audio = null;
    if (claimed) await chrome.runtime.sendMessage({ target: 'background', type: 'recording-stopped', sessionId });
    $('error').textContent = err.name === 'NotAllowedError'
      ? 'Screen sharing was cancelled or blocked. Choose a screen to try again.'
      : err.message || String(err);
    $('error').hidden = false;
    show('pick');
  } finally {
    starting = false;
    $('choose').disabled = false;
  }
}

function stop() {
  if (recorder && recorder.state !== 'inactive') recorder.stop();
}

function finish(blob, filename) {
  clearInterval(timerId);
  streams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
  audio?.ctx.close();
  recorder = null;

  const url = URL.createObjectURL(blob);
  const a = $('download');
  a.href = url;
  a.download = filename;
  a.click();

  $('preview').src = url;
  $('savedName').textContent = filename;
  document.title = 'Recording ready';
  show('done');
  chrome.runtime.sendMessage({ target: 'background', type: 'recording-stopped', sessionId });
}

function startTimer() {
  const t0 = Date.now();
  const tick = () => {
    const s = Math.floor((Date.now() - t0) / 1000);
    const hh = Math.floor(s / 3600);
    const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    const text = hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
    $('timer').textContent = text;
    document.title = `● ${text} Recording`;
  };
  tick();
  timerId = setInterval(tick, 500);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'recorder' || msg.type !== 'stop' || msg.sessionId !== sessionId) return;
  stop();
  sendResponse({ ok: true });
});

window.addEventListener('beforeunload', (e) => {
  if (recorder) e.preventDefault(); // warn before losing an in-progress recording
});

$('choose').addEventListener('click', begin);
$('stop').addEventListener('click', stop);
