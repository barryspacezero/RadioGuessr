// let audio = null;
// let stopTimer = null;

// export function playAudio(url, { onEnded, onError } = {}) {
//   stopAudio();
//   audio = new Audio(url);
//   audio.volume = 0.85;
//   audio.onerror = () => { audio = null; onError?.(); };
//   audio.play().catch(() => { audio = null; onError?.(); });
//   audio.onwaiting = () => { loading = true };
//   audio.onplaying = () => { loading = false };
//   // stopTimer = setTimeout(() => { stopAudio(); onEnded?.(); });
// }

// export function stopAudio() {
//   clearTimeout(stopTimer);
//   if (audio) { audio.pause(); audio = null; }
// }

export function playAudio(url, { onEnded, onError, onLoading, onPlaying } = {}) {
  stopAudio()

  audio = new Audio(url)
  audio.volume = 0.85

  audio.onwaiting = () => onLoading?.()
  audio.onplaying = () => onPlaying?.()

  audio.onerror = () => {
    audio = null
    onError?.()
  }

  audio.play().catch(() => {
    audio = null
    onError?.()
  })
}