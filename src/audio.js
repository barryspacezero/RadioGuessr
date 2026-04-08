import Hls from "hls.js";
let audio = null;
let stopTimer = null;
let hls = null;

export function playAudio(url, { onEnded, onError, onLoading, onPlaying } = {}) {
  stopAudio();
  
  // Save local reference and update global reference immediately
  const currentAudio = new Audio(url);
  audio = currentAudio;
  
  audio.volume = 0.85;
  audio.onerror = () => { 
    if (audio === currentAudio) { audio = null; onError?.(); } 
  };
  audio.onwaiting = () => { onLoading?.(); };
  audio.onplaying = () => { onPlaying?.(); };

  if (url.endsWith(".m3u8")) {
    hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(audio);
    console.log("HLS audio found")
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      audio.play().catch(() => { 
        if (audio === currentAudio) { audio = null; onError?.(); } 
      });
    });
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal && audio === currentAudio) {
        audio = null;
        onError?.();
      }
    });
  } else {
    audio.play().catch(() => { 
      if (audio === currentAudio) { audio = null; onError?.(); } 
    });
  }
}

export function stopAudio() {
  clearTimeout(stopTimer);
  if (audio) { audio.pause(); audio = null; }
  if (hls) { hls.destroy(); hls = null; }
}

