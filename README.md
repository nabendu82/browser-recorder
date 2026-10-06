# Browser Recorder

A tiny, no-frills Chrome extension that records a **browser tab**, a **window** or your **whole screen**, with the sound included.

It's built for things like recording yourself playing a browser game: the game's audio goes into the video, and you keep hearing it while you record.

No account, no uploads, no tracking. Recordings are saved straight to your Downloads folder.

## Features

- **Record this tab** in one click, with the tab's audio. You still hear the tab while it records.
- **Record a screen or window** using Chrome's built-in picker, with optional system or tab audio.
- **Add your microphone** (optional). It's mixed with the tab or system audio.
- Saves **MP4** (opens in QuickTime) when Chrome supports it, otherwise WebM.
- Records at up to 1080p and 60 fps, at 8 Mbps.
- A red **REC** badge on the toolbar icon while recording.
- Light and dark mode.

## Install (from source)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/<your-username>/browser-recorder.git
   ```
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the `browser-recorder` folder.
5. Pin the extension so its icon stays in the toolbar.

Requires Chrome 116 or newer.

## Usage

1. Click the toolbar icon.
2. Choose **This tab** or **Screen / Window**.
3. Optionally tick **Microphone**. The first time, a tab opens to ask for mic access.
4. Click **Start recording**.
   - For **Screen / Window**, choose what to share in Chrome's picker. Turn on **Share audio** to capture sound.
5. To stop, click the icon and choose **Stop & save**, or use Chrome's "Stop sharing" bar.

The file is saved as `Recording YYYY-MM-DD at HH.MM.SS.mp4` in your Downloads folder.

## How it works

| Mode | API | Where recording runs |
| --- | --- | --- |
| This tab | `chrome.tabCapture` | An [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen), so you can keep using the tab |
| Screen / Window | `navigator.mediaDevices.getDisplayMedia` | A small extension tab (`recorder.html`) that shows a preview when done |

Audio sources are mixed with the Web Audio API and recorded with `MediaRecorder`.

### Permissions

| Permission | Why |
| --- | --- |
| `tabCapture` | Capture the current tab's video and audio |
| `offscreen` | Record in the background while you use the tab |
| `downloads` | Save the finished recording |
| `storage` | Remember your last choice and the recording state |

## Project structure

```
manifest.json      Extension manifest (MV3)
background.js      Service worker: state, start/stop routing, saving files
popup.html/js/css  Toolbar popup UI
offscreen.html/js  Tab recording (tabCapture)
recorder.html/js   Screen/window recording (getDisplayMedia)
permission.html/js One-time microphone permission page
common.js          Shared helpers: MediaRecorder setup, audio mixing, file naming
page.css           Styles for recorder and permission pages
icons/             Extension icons
```

## Limitations

- Chrome's own pages (`chrome://…`, the Chrome Web Store) can't be recorded.
- Whether you get **system audio** from a whole-screen recording on macOS depends on your Chrome and macOS versions. To record a game's sound reliably, use **This tab**.
- In Screen / Window mode, closing the recorder tab while recording discards the recording. The tab warns you before it closes.

## License

[MIT](LICENSE)
