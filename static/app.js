const mic = document.querySelector('#mic');
const state = document.querySelector('#state');
const hint = document.querySelector('#hint');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let activeAudio;
const conversationHistory = [];

function setState(label, detail) {
  state.textContent = label;
  hint.textContent = detail;
}

function browserVoiceFallback(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.04;
  utterance.pitch = 0.96;
  utterance.onstart = () => setState('Speaking', 'Tap the microphone when you want to ask something else.');
  utterance.onend = () => setState('Ready when you are', 'Tap once, then speak naturally.');
  window.speechSynthesis.speak(utterance);
}

async function speak(text) {
  if (activeAudio) activeAudio.pause();
  try {
    const response = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Voice unavailable');
    const url = URL.createObjectURL(await response.blob());
    activeAudio = new Audio(url);
    activeAudio.onplay = () => setState('Speaking', 'Tap the microphone when you want to ask something else.');
    activeAudio.onended = () => {
      URL.revokeObjectURL(url);
      setState('Ready when you are', 'Tap once, then speak naturally.');
    };
    await activeAudio.play();
  } catch {
    browserVoiceFallback(text);
  }
}

async function ask(query) {
  setState('Thinking', 'Working out what you need.');
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, history: conversationHistory }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'The request failed');
  conversationHistory.push(
    { role: 'user', content: query },
    { role: 'assistant', content: data.answer },
  );
  if (conversationHistory.length > 8) conversationHistory.splice(0, conversationHistory.length - 8);
  setState('Answering', 'Armani has it.');
  await speak(data.answer);
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
  if (activeAudio) activeAudio.pause();
  recognition.start();
});
