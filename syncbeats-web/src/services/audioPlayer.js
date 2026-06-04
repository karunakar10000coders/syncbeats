class AudioPlayerService {
  constructor() {
    this.audio = new Audio();
    this.currentFile = null;
    this.onStateChangeCallback = null;
    this.onTimeUpdateCallback = null;

    this.audio.addEventListener('play', () => this.triggerStateChange('playing'));
    this.audio.addEventListener('pause', () => this.triggerStateChange('paused'));
    this.audio.addEventListener('ended', () => this.triggerStateChange('ended'));
    
    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime * 1000); // Exposes in milliseconds
      }
    });
  }

  registerCallbacks(onStateChange, onTimeUpdate) {
    this.onStateChangeCallback = onStateChange;
    this.onTimeUpdateCallback = onTimeUpdate;
  }

  triggerStateChange(state) {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(state);
    }
  }

  async loadFile(fileOrUrl, title = '') {
    try {
      this.currentFile = fileOrUrl;
      if (fileOrUrl instanceof File) {
        const objectUrl = URL.createObjectURL(fileOrUrl);
        this.audio.src = objectUrl;
      } else {
        this.audio.src = fileOrUrl;
      }
      this.audio.load();
      console.log(`Loaded song: ${title}`);
    } catch (err) {
      console.error('Error loading audio file:', err);
      throw err;
    }
  }

  play() {
    if (!this.audio.src) return;
    this.audio.play().catch(err => console.error('Play request failed:', err));
  }

  pause() {
    this.audio.pause();
  }

  seek(positionMs) {
    if (!this.audio.src) return;
    this.audio.currentTime = positionMs / 1000;
  }

  setSpeed(speed) {
    if (!this.audio.src) return;
    this.audio.playbackRate = speed;
  }

  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getPosition() {
    return this.audio.currentTime * 1000;
  }

  getDuration() {
    return (this.audio.duration || 0) * 1000;
  }

  isPlaying() {
    return !this.audio.paused;
  }
}

const audioPlayerInstance = new AudioPlayerService();
export default audioPlayerInstance;
