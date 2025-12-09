// static/js/waveform.js
// Simple waveform visualizer using WebAudio AnalyserNode and canvas
console.log("waveform.js loaded");

(function () {
  const canvas = document.getElementById("waveform");
  if (!canvas || !window.AudioContext) return;
  const ctx = canvas.getContext("2d");
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.fftSize;
  const dataArray = new Uint8Array(bufferLength);
  let source = null;
  let rafId = null;

  function draw() {
    analyser.getByteTimeDomainData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(127,211,255,0.9)";
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    rafId = requestAnimationFrame(draw);
  }

  async function connectMicrophoneToWaveform() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      draw();
      console.log("waveform: connected microphone");
    } catch (err) {
      console.warn("waveform: microphone not allowed or unavailable", err);
    }
  }

  function disconnect() {
    if (rafId) cancelAnimationFrame(rafId);
    try { if (source && source.mediaStream) source.mediaStream.getTracks().forEach(t=>t.stop()); } catch(e){}
  }

  window.connectMicrophoneToWaveform = connectMicrophoneToWaveform;
  window.disconnectWaveform = disconnect;
})();
