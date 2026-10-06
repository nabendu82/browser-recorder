// Shared recording helpers used by offscreen.js (tab mode) and recorder.js (screen/window mode).

// Prefer MP4 so the file opens in QuickTime on macOS; fall back to WebM on older Chrome.
const MIME_TYPES = [
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

function pickMimeType() {
  return MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

// Same naming style as macOS screenshots: "Recording 2026-10-06 at 18.20.11.mp4"
function makeFilename(mimeType) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  return `Recording ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} at ` +
    `${p(d.getHours())}.${p(d.getMinutes())}.${p(d.getSeconds())}.${ext}`;
}

// Mixes every audio track from `sources` into one track. Optionally plays
// `monitor` stream back to the speakers (tab capture mutes the tab otherwise).
function mixAudio(sources, monitor) {
  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  for (const stream of sources) {
    if (!stream.getAudioTracks().length) continue;
    const node = ctx.createMediaStreamSource(stream);
    node.connect(dest);
    if (stream === monitor) node.connect(ctx.destination);
  }
  ctx.resume();
  return { ctx, tracks: dest.stream.getAudioTracks() };
}

function startRecorder(stream, onDone) {
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
    audioBitsPerSecond: 192_000,
  });
  const chunks = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType });
    onDone(blob, makeFilename(recorder.mimeType));
  };
  recorder.start(1000);
  return recorder;
}
