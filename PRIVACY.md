# Browser Recorder Privacy Policy

Last updated: 7 October 2026

Browser Recorder is maintained by nabendu82. It records a tab, window or screen you choose and optionally your microphone. Recording data is processed on your device to create a video file. The extension does not upload recordings or send them to the developer or any third party.

## Data handled locally

- **Video and audio:** When you start a recording, the extension captures the selected tab, window or screen, any shared audio, and microphone audio if you enable it. A recording may contain personal or sensitive information visible or audible in the source you choose. This data is used only to create your recording.
- **Preferences:** Your recording mode and microphone preference are saved in Chrome's local extension storage. The extension does not use Chrome's synced storage.
- **Session state:** While Chrome is running, session storage holds recording status, start time, the relevant tab ID and an internal recording identifier. This supports the recording controls and toolbar badge; it is not a browsing-history log.

## Storage and deletion

Recording chunks are held in memory until a video file is created. Temporary recording data can remain in the recorder page for preview or downloading again, or in the offscreen document until it closes. Close the recorder page or Chrome to release that temporary data. Recordings are saved using Chrome's download behavior, normally to your Downloads folder. They remain on your device until you delete them yourself; uninstalling the extension does not delete downloaded videos. Uninstalling removes the extension's stored preferences.

The extension does not provide encrypted storage for downloaded videos. Your device, browser and any folder backup or sync services you configure control access to saved files.

## Sharing, analytics and advertising

Browser Recorder has no account system, analytics, tracking, advertising, remote recording service or automatic uploads. The developer does not receive your recordings, microphone audio or locally stored preferences. The extension does not sell or transfer this data, use it for advertising, or use it to determine creditworthiness or lending eligibility.

If you choose to follow the support link, GitHub handles that visit and any information you submit under its own privacy policy. Do not attach private recordings to public support issues.

## Permissions

- `tabCapture`: Capture the tab you choose after you start recording.
- `offscreen`: Keep a tab recording running after the toolbar popup closes.
- `downloads`: Save completed tab recordings to your device.
- `storage`: Remember preferences and track the current recording session locally.

Screen sharing and microphone access also use Chrome's permission prompts. Microphone access is optional. You can stop recording from the extension controls and manage microphone permission in Chrome.

## Limited Use

Browser Recorder's use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Contact and changes

For privacy questions, contact the maintainer through the [Browser Recorder issue tracker](https://github.com/nabendu82/browser-recorder/issues). Changes to this policy will be published here with an updated date.
