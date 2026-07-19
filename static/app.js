const mic = document.querySelector('#mic');
const state = document.querySelector('#state');
const hint = document.querySelector('#hint');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

function setState(label, detail) {
  state.textContent = label;
  hint.textContent = detail;
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.04;
  utterance.pitch = 0.96;
  utterance.onstart = () => setState('Speaking', 'Tap the microphone when you want to ask something else.');
  utterance.onend = () => setState('Ready when you are', 'Tap once, then speak naturally.');
  window.speechSynthesis.speak(utterance);
}

async function ask(query) {
  setState('Searching', 'Bright Data is checking the live web.');
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'The request failed');
  setState('Thinking', 'Moss and Groq are shaping the answer.');
  speak(data.answer);
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.onstart = () => {
    mic.classList.add('recording');
    setState('Listening', 'Ask about anything on the live web.');
  };
  recognition.onend = () => mic.classList.remove('recording');
  recognition.onerror = () => setState('Could not hear you', 'Tap the microphone and try again.');
  recognition.onresult = async event => {
    try { await ask(event.results[0][0].transcript); }
    catch (error) { setState('Could not answer', error.message); }
  };
}

mic.addEventListener('click', () => {
  if (!recognition) {
    setState('Browser unsupported', 'Open this page in Chrome or Safari with speech recognition enabled.');
    return;
  }
  window.speechSynthesis.cancel();
  recognition.start();
});
