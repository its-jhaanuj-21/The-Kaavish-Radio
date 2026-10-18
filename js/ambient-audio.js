/**
 * The Kaavish Radio — Web Audio Generative Ambient Engine
 * Synthesizes Rain (Baarish), Vinyl Crackle, Night Crickets, and Distant Thunder
 * Zero external audio files required — 100% reliable and instantaneous!
 */

class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isInitialized = false;

    // Generators and gain nodes
    this.nodes = {
      rain: { gain: null, source: null, active: false, volume: 0.65 },
      vinyl: { gain: null, source: null, active: false, volume: 0.5 },
      crickets: { gain: null, timer: null, active: false, volume: 0.4 },
      thunder: { gain: null, timer: null, active: false, volume: 0.5 }
    };
  }

  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    this.isInitialized = true;
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /* -------------------------------------------------------------------------
     Rain (Baarish) Synthesizer: Filtered Pink Noise + Droplet Bursts
     ------------------------------------------------------------------------- */
  toggleRain(forceState) {
    this.ensureContext();
    const node = this.nodes.rain;
    const shouldEnable = forceState !== undefined ? forceState : !node.active;

    if (shouldEnable) {
      if (node.source) return true;
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(280, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(node.volume, this.ctx.currentTime + 1.2);

      noise.connect(filter);
      filter.connect(highpass);
      highpass.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      node.source = noise;
      node.gain = gain;
      node.active = true;
      return true;
    } else {
      if (node.source && node.gain) {
        node.gain.gain.setValueAtTime(node.gain.gain.value, this.ctx.currentTime);
        node.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          if (node.source) {
            try { node.source.stop(); } catch(e){}
            node.source.disconnect();
            node.source = null;
          }
        }, 900);
      }
      node.active = false;
      return false;
    }
  }

  /* -------------------------------------------------------------------------
     Vinyl Crackle Synthesizer: Vintage Gramophone Pops & Hiss
     ------------------------------------------------------------------------- */
  toggleVinyl(forceState) {
    this.ensureContext();
    const node = this.nodes.vinyl;
    const shouldEnable = forceState !== undefined ? forceState : !node.active;

    if (shouldEnable) {
      if (node.source) return true;
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Continuous soft vinyl groove hiss
        let sample = (Math.random() * 2 - 1) * 0.015;
        // Periodic vinyl clicks and pops
        if (Math.random() < 0.0007) {
          const pop = (Math.random() * 2 - 1) * 0.35;
          sample += pop;
        }
        data[i] = sample;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2400, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(node.volume * 0.7, this.ctx.currentTime + 1.0);

      source.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(this.masterGain);

      source.start();
      node.source = source;
      node.gain = gain;
      node.active = true;
      return true;
    } else {
      if (node.source && node.gain) {
        node.gain.gain.setValueAtTime(node.gain.gain.value, this.ctx.currentTime);
        node.gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
        setTimeout(() => {
          if (node.source) {
            try { node.source.stop(); } catch(e){}
            node.source.disconnect();
            node.source = null;
          }
        }, 700);
      }
      node.active = false;
      return false;
    }
  }

  /* -------------------------------------------------------------------------
     Night Crickets Synthesizer
     ------------------------------------------------------------------------- */
  toggleCrickets(forceState) {
    this.ensureContext();
    const node = this.nodes.crickets;
    const shouldEnable = forceState !== undefined ? forceState : !node.active;

    if (shouldEnable) {
      if (node.timer) return true;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(node.volume * 0.25, this.ctx.currentTime);
      gain.connect(this.masterGain);
      node.gain = gain;

      const playCricketChirp = () => {
        if (!node.active) return;
        try {
          const osc = this.ctx.createOscillator();
          const chirpGain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(4600 + Math.random() * 300, this.ctx.currentTime);

          chirpGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
          chirpGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.04);
          chirpGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

          osc.connect(chirpGain);
          chirpGain.connect(gain);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.15);
        } catch(e) {}

        const nextDelay = 350 + Math.random() * 600;
        node.timer = setTimeout(playCricketChirp, nextDelay);
      };

      node.active = true;
      playCricketChirp();
      return true;
    } else {
      if (node.timer) {
        clearTimeout(node.timer);
        node.timer = null;
      }
      node.active = false;
      return false;
    }
  }

  /* -------------------------------------------------------------------------
     Distant Monsoon Thunder (Baadal)
     ------------------------------------------------------------------------- */
  toggleThunder(forceState) {
    this.ensureContext();
    const node = this.nodes.thunder;
    const shouldEnable = forceState !== undefined ? forceState : !node.active;

    if (shouldEnable) {
      if (node.timer) return true;
      node.active = true;

      const playRumble = () => {
        if (!node.active) return;
        try {
          const dur = 4 + Math.random() * 3;
          const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 2.8;
          }
          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(140, this.ctx.currentTime);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(node.volume * 0.7, this.ctx.currentTime + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.masterGain);

          noise.start();
        } catch(e) {}

        const nextThunder = 20000 + Math.random() * 30000;
        node.timer = setTimeout(playRumble, nextThunder);
      };

      playRumble();
      return true;
    } else {
      if (node.timer) {
        clearTimeout(node.timer);
        node.timer = null;
      }
      node.active = false;
      return false;
    }
  }

  /* Volume adjustments */
  setVolume(soundType, val) {
    if (!this.nodes[soundType]) return;
    this.nodes[soundType].volume = val;
    if (this.nodes[soundType].gain && this.ctx) {
      this.nodes[soundType].gain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }
}

window.ambientEngine = new AmbientAudioEngine();
