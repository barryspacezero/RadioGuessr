let audio = null;
let stopTimer = null;
let loading = false

export function playAudio(url, { onEnded, onError } = {}) {
  stopAudio();
  audio = new Audio(url);
  audio.volume = 0.85;
  audio.onerror = () => { audio = null; onError?.(); };
  audio.play().catch(() => { audio = null; onError?.(); });
  audio.onwaiting = () => { loading = true };
  audio.onplaying = () => { loading = false };
  // stopTimer = setTimeout(() => { stopAudio(); onEnded?.(); });
}

export function stopAudio() {
  clearTimeout(stopTimer);
  if (audio) { audio.pause(); audio = null; }
}

export function isLoading() {
  return loading;
}
