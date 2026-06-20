import Hls from "hls.js";
let audio = null;
let stopTimer = null;
let hls = null;
let globalVolume = 0.85;
let activeProbes = [];

export function setVolume(vol) {
  globalVolume = vol;
  if (audio) { audio.volume = vol; }
}

export function probeAndPlayAudio(urls, { onLoading, onPlaying, onError } = {}) {
  stopAudio();
  
  if (!urls || urls.length === 0) {
    onError?.();
    return;
  }

  let resolved = false;
  let errorCount = 0;
  const instances = [];
  activeProbes = instances; // Global tracking for forceful cancellation

  const cleanupLosers = (winnerInstance) => {
    instances.forEach(inst => {
      if (inst !== winnerInstance) {
        if (inst.audio) { inst.audio.pause(); inst.audio.removeAttribute('src'); inst.audio.load(); }
        if (inst.hls) inst.hls.destroy();
      }
    });
  };

  urls.forEach((url, index) => {
    const inst = { audio: new Audio(url), hls: null, url, index };
    instances.push(inst);

    inst.audio.volume = 0; // mute while probing
    inst.audio.muted = true; // helps bypass autoplay policies for probing

    inst.audio.onwaiting = () => { if (!resolved && index === 0) onLoading?.(); };

    const handleSuccess = () => {
      if (resolved) return;
      resolved = true;
      audio = inst.audio;
      hls = inst.hls;
      cleanupLosers(inst);
      
      audio.muted = false;
      audio.volume = globalVolume;
      audio.onerror = () => {
        if (audio === inst.audio) { audio = null; onError?.(); }
      };
      onPlaying?.(index);
    };

    const handleFailure = () => {
      if (resolved) return;
      errorCount++;
      if (errorCount === urls.length) {
        resolved = true;
        cleanupLosers(null);
        onError?.();
      }
    };

    inst.audio.onplaying = handleSuccess;
    inst.audio.onerror = handleFailure;

    if (url.endsWith(".m3u8")) {
      inst.hls = new Hls();
      inst.hls.loadSource(url);
      inst.hls.attachMedia(inst.audio);
      inst.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        inst.audio.play().catch(handleFailure);
      });
      inst.hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) handleFailure();
      });
    } else {
      inst.audio.play().catch(handleFailure);
    }
  });
}

export function playAudio(url, options = {}) {
  return probeAndPlayAudio([url], options);
}

export function stopAudio() {
  clearTimeout(stopTimer);
  if (audio) { audio.pause(); audio = null; }
  if (hls) { hls.destroy(); hls = null; }
  
  // Forcefully kill any pending background probes
  activeProbes.forEach(inst => {
    if (inst.audio) {
      inst.audio.pause();
      inst.audio.removeAttribute('src');
      inst.audio.load();
    }
    if (inst.hls) {
      inst.hls.destroy();
    }
  });
  activeProbes = [];
}

export function pauseAudio() {
  if (audio) { audio.pause(); }
}

export function resumeAudio() {
  if (audio) { audio.play().catch(err => console.error("Failed to resume audio:", err)); }
}

export function getAudioState() {
  if (!audio) return "stopped";
  return audio.paused ? "paused" : "playing";
}

