// static/js/recorder.js
// Lightweight recorder: start/stop on mic button click, sends audio to /voice
// Requires presence of #mic-btn element and server endpoint /voice (multipart 'audio').
console.log("recorder.js loaded");

(function () {
  let mediaRecorder = null;
  let recordedChunks = [];
  const micBtn = document.getElementById("mic-btn");

  function setRecordingState(on) {
    if (window.setRecording) window.setRecording(on);
    if (micBtn) {
      if (on) micBtn.classList.add("recording");
      else micBtn.classList.remove("recording");
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];
      mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) recordedChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        // send blob to server
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        sendAudioBlob(blob);
        // stop all tracks
        stream.getTracks().forEach(t => t.stop());
        setRecordingState(false);
      };
      mediaRecorder.start();
      setRecordingState(true);
      console.log("Recording started");
    } catch (err) {
      console.error("startRecording error", err);
      alert("Microphone access denied or error");
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      console.log("Recording stopped");
    } else {
      setRecordingState(false);
    }
  }

  async function sendAudioBlob(blob) {
    const fd = new FormData();
    fd.append("audio", blob, "voice.webm");
    try {
      const res = await fetch("/voice", {
        method: "POST",
        credentials: "include",  // Send session cookie
        body: fd
      });
      const data = await res.json().catch(()=>({}));
      if (res.status === 401) {
        alert("Session expired. Please login again");
        window.location.href = "/login";
        return;
      }
      if (data.transcription) window.appendMessage && window.appendMessage("You (audio): " + data.transcription, "user");
      if (data.reply) window.appendMessage && window.appendMessage(data.reply, "bot");
    } catch (err) {
      console.error("send audio error", err);
      alert("Failed to send audio");
    }
  }

  // Attach UI
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      // toggle
      if (micBtn.classList.contains("recording")) {
        stopRecording();
      } else {
        startRecording();
      }
    });
  }

  // Expose control for external code
  window.recorderStart = startRecording;
  window.recorderStop = stopRecording;
  window.setRecording = setRecordingState;
})();
