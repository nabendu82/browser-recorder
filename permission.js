const $ = (id) => document.getElementById(id);

async function ask() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    $('title').textContent = 'Microphone allowed';
    $('text').textContent = 'Go back to the tab you want to record and click the extension icon again.';
    $('allow').hidden = true;
  } catch {
    $('title').textContent = 'Microphone blocked';
    $('text').textContent = 'Allow the microphone using the icon in the address bar, then try again — or record without the microphone.';
  }
}

$('allow').addEventListener('click', ask);
ask();
