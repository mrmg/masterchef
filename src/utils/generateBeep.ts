/**
 * Generates a shocking microwave-style beep sound using Web Audio API
 * Returns a blob URL that can be used as an audio source
 */
export const generateMicrowaveBeep = (): string => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 1.2; // 1200ms beep (4x longer than original 300ms)
  const frequency = 1200; // 1.2kHz tone (higher pitch for more attention)
  
  // Create buffer
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  // Generate shocking beep with multiple pulses
  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    
    // Create 3 pulses for more shocking effect
    const pulsePattern = 
      (t < 0.3 ? 1 : 0) +  // First pulse
      (t >= 0.4 && t < 0.7 ? 1 : 0) +  // Second pulse
      (t >= 0.8 && t < 1.1 ? 1 : 0);  // Third pulse
    
    // Envelope for each pulse (quick attack, slower decay)
    const pulseTime = t % 0.4;
    const envelope = Math.min(pulseTime * 50, 1) * Math.max(1 - pulseTime * 2, 0);
    
    // Generate tone with harmonics for richer sound
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3; // Add second harmonic
    
    channelData[i] = (fundamental + harmonic) * envelope * pulsePattern * 0.5; // 50% volume
  }
  
  // Convert buffer to WAV blob
  const wav = audioBufferToWav(buffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

/**
 * Converts an AudioBuffer to WAV format
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length * buffer.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(36 + length); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(buffer.numberOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // avg. bytes/sec
  setUint16(buffer.numberOfChannels * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length); // chunk length

  // Write interleaved data
  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return arrayBuffer;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
