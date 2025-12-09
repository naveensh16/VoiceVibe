// static/js/chat.js
console.log("chat.js loaded");

// Performance optimizations
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

document.addEventListener("DOMContentLoaded", () => {
  const messagesEl = document.getElementById("messages");
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const typingIndicator = document.getElementById("typing-indicator");
  const clearBtn = document.getElementById("clear-btn");
  const exportBtn = document.getElementById("export-btn");
  const navButtons = document.querySelectorAll(".nav-item");

  if (!messagesEl || !input || !sendBtn) {
    console.error("[chat] Required elements missing");
    return;
  }

  // Use session-based storage (reduced localStorage usage)
  let chatHistory = [];
  let isLoadingHistory = false;

  function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Optimized message append with DocumentFragment
  function appendMessage(text, role = "bot") {
    const fragment = document.createDocumentFragment();
    
    const msgDiv = document.createElement("div");
    msgDiv.className = `msg ${role}`;
    msgDiv.textContent = text;
    
    const timeDiv = document.createElement("div");
    timeDiv.className = "msg-time";
    timeDiv.textContent = formatTime(new Date());
    
    fragment.appendChild(msgDiv);
    fragment.appendChild(timeDiv);
    messagesEl.appendChild(fragment);
    
    // Add to session history (no localStorage writes)
    chatHistory.push({
      text: text,
      role: role,
      timestamp: new Date().toISOString()
    });
    
    // Throttled scroll
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
    
    return msgDiv;
  }

  // Optimized batch rendering for chat history
  function loadChatHistory() {
    if (isLoadingHistory) return;
    isLoadingHistory = true;
    
    requestAnimationFrame(() => {
      const fragment = document.createDocumentFragment();
      
      chatHistory.forEach(msg => {
        const msgDiv = document.createElement("div");
        msgDiv.className = `msg ${msg.role}`;
        msgDiv.textContent = msg.text;
        
        const timeDiv = document.createElement("div");
        timeDiv.className = "msg-time";
        timeDiv.textContent = formatTime(new Date(msg.timestamp));
        
        fragment.appendChild(msgDiv);
        fragment.appendChild(timeDiv);
      });
      
      messagesEl.innerHTML = "";
      messagesEl.appendChild(fragment);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      isLoadingHistory = false;
    });
  }

  function clearChat() {
    if (confirm("Clear all chat history?")) {
      chatHistory = [];
      messagesEl.innerHTML = "";
      appendMessage("👋 Welcome to VoiceVibe! I'm your AI assistant. How can I help you today?", "bot");
    }
  }

  function exportChat() {
    const text = chatHistory.map(msg => 
      `[${new Date(msg.timestamp).toLocaleString()}] ${msg.role.toUpperCase()}: ${msg.text}`
    ).join("\n\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicevibe-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function showTyping() {
    if (typingIndicator) typingIndicator.classList.remove("hidden");
  }

  function hideTyping() {
    if (typingIndicator) typingIndicator.classList.add("hidden");
  }

  function adjustInputHeight() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    input.value = "";
    adjustInputHeight();
    showTyping();
    sendBtn.disabled = true;

    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      hideTyping();

      if (res.status === 401) {
        appendMessage("❌ Session expired. Redirecting to login...", "bot");
        setTimeout(() => window.location.href = "/login", 2000);
        return;
      }

      if (!res.ok) {
        appendMessage(`❌ Error: ${data.error || "Request failed"}`, "bot");
        return;
      }

      if (data.reply) {
        appendMessage(data.reply, "bot");
      } else {
        appendMessage("No response from server", "bot");
      }
    } catch (err) {
      hideTyping();
      console.error("[chat] Error:", err);
      appendMessage("❌ Network error. Please try again.", "bot");
    } finally {
      sendBtn.disabled = false;
    }
  }

  // Navigation handlers
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const pane = btn.dataset.pane;
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      if (pane === "history") {
        showHistoryPanel();
      } else if (pane === "settings") {
        showSettingsPanel();
      } else {
        hideAllPanels();
      }
    });
  });

  function showHistoryPanel() {
    const historyHTML = chatHistory.length === 0 ? 
      "<p style='text-align:center; color:var(--text-muted); padding:20px;'>No chat history yet</p>" :
      chatHistory.map((msg, idx) => `
        <div style="padding:12px; background:rgba(255,255,255,0.03); margin-bottom:8px; border-radius:8px; border-left:3px solid ${msg.role === 'user' ? '#007AFF' : '#666'};">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">${new Date(msg.timestamp).toLocaleString()}</div>
          <div style="font-weight:600; color:${msg.role === 'user' ? '#007AFF' : 'var(--text-secondary)'}; margin-bottom:4px;">${msg.role === 'user' ? 'You' : 'Assistant'}</div>
          <div style="color:var(--text);">${msg.text}</div>
        </div>
      `).join("");
    
    messagesEl.innerHTML = historyHTML;
  }

  function showSettingsPanel() {
    messagesEl.innerHTML = `
      <div style="padding:20px; max-width:600px; margin:0 auto;">
        <h3 style="margin-bottom:20px; color:var(--text);">Settings</h3>
        <div style="padding:16px; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:16px;">
          <label style="display:block; margin-bottom:8px; color:var(--text); font-weight:600;">Theme</label>
          <p style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">Choose your preferred theme</p>
          <button onclick="document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem('theme', 'light');" style="padding:10px 20px; background:#007AFF; color:white; border:none; border-radius:8px; margin-right:8px; cursor:pointer;">Light Mode</button>
          <button onclick="document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark');" style="padding:10px 20px; background:#1c1c1e; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px; cursor:pointer;">Dark Mode</button>
        </div>
        <div style="padding:16px; background:rgba(255,255,255,0.03); border-radius:12px;">
          <label style="display:block; margin-bottom:8px; color:var(--text); font-weight:600;">Data Management</label>
          <button id="clear-session-btn" style="padding:10px 20px; background:#ef4444; color:white; border:none; border-radius:8px; cursor:pointer;">Clear Session History</button>
        </div>
      </div>
    `;
    
    // Add click handler for clear session button
    setTimeout(() => {
      const clearSessionBtn = document.getElementById('clear-session-btn');
      if (clearSessionBtn) {
        clearSessionBtn.addEventListener('click', async () => {
          if (confirm('Clear all session chat history?')) {
            try {
              await fetch('/session-history', {
                method: 'DELETE',
                credentials: 'include'
              });
              chatHistory = [];
              location.reload();
            } catch (err) {
              console.error('Failed to clear session:', err);
            }
          }
        });
      }
    }, 100);
  }

  function hideAllPanels() {
    loadChatHistory();
  }

  // Event listeners
  sendBtn.addEventListener("click", sendMessage);
  if (clearBtn) clearBtn.addEventListener("click", clearChat);
  if (exportBtn) exportBtn.addEventListener("click", exportChat);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener("input", adjustInputHeight);

  // File Upload Functionality
  const fileInput = document.getElementById("file-input");
  const fileBtn = document.getElementById("file-btn");
  const micBtn = document.getElementById("mic-btn");
  const filePreview = document.getElementById("file-preview");
  const fileName = document.getElementById("file-name");
  const fileRemove = document.getElementById("file-remove");
  const uploadDropZone = document.getElementById("upload-drop-zone");
  const uploadList = document.getElementById("upload-list");
  const clearUploadsBtn = document.getElementById("clear-uploads-btn");

  let uploadedFiles = [];
  let currentFile = null;

  // File button click
  if (fileBtn && fileInput) {
    fileBtn.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  // Mic button click
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      appendMessage("🎤 Voice recording feature coming soon!", "bot");
    });
  }

  // File remove
  if (fileRemove) {
    fileRemove.addEventListener("click", () => {
      clearCurrentFile();
    });
  }

  // Drag and drop
  if (uploadDropZone && fileInput) {
    uploadDropZone.addEventListener("click", () => {
      fileInput.click();
    });

    uploadDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadDropZone.classList.add("drag-over");
    });

    uploadDropZone.addEventListener("dragleave", () => {
      uploadDropZone.classList.remove("drag-over");
    });

    uploadDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadDropZone.classList.remove("drag-over");
      if (e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });
  }

  // Clear uploads
  if (clearUploadsBtn) {
    clearUploadsBtn.addEventListener("click", () => {
      if (confirm("Clear all uploaded files?")) {
        uploadedFiles = [];
        currentFile = null;
        updateUploadList();
        clearCurrentFile();
      }
    });
  }

  function handleFileSelection(file) {
    const maxSize = 25 * 1024 * 1024; // 25MB
    const allowedTypes = [
      'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', // Audio
      'application/pdf', 'text/plain' // Documents
    ];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.pdf', '.txt'];

    // Check file size
    if (file.size > maxSize) {
      appendMessage("❌ File too large. Maximum size is 25MB.", "bot");
      return;
    }

    // Check file type
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      appendMessage("❌ Invalid file type. Supported: MP3, WAV, M4A, PDF, TXT", "bot");
      return;
    }

    currentFile = file;
    if (fileName) fileName.textContent = file.name;
    if (filePreview) filePreview.classList.remove("hidden");
    
    // Add to upload list
    uploadedFiles.push({
      file: file,
      id: Date.now(),
      status: 'pending'
    });
    updateUploadList();
    
    // Auto-process if audio file
    if (file.type.startsWith('audio/')) {
      processAudioFile(file);
    }
  }

  function clearCurrentFile() {
    currentFile = null;
    if (fileInput) fileInput.value = '';
    if (filePreview) filePreview.classList.add("hidden");
    if (fileName) fileName.textContent = '';
  }

  function updateUploadList() {
    if (!uploadList) return;

    if (uploadedFiles.length === 0) {
      uploadList.innerHTML = '<div class="upload-empty">No files uploaded yet</div>';
      return;
    }

    uploadList.innerHTML = uploadedFiles.map(item => {
      const fileIcon = item.file.type.startsWith('audio/') ? '🎵' : '📄';
      const fileSize = formatFileSize(item.file.size);
      const statusClass = item.status === 'completed' ? 'completed' : 'pending';
      
      return `
        <div class="upload-item" data-id="${item.id}">
          <div class="upload-item-icon">${fileIcon}</div>
          <div class="upload-item-info">
            <div class="upload-item-name">${item.file.name}</div>
            <div class="upload-item-size">${fileSize}</div>
          </div>
          <div class="upload-item-status">${item.status === 'completed' ? '✓ Done' : '⏳ Pending'}</div>
          <div class="upload-item-remove" onclick="removeUploadedFile(${item.id})">×</div>
        </div>
      `;
    }).join('');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function processAudioFile(file) {
    appendMessage(`🎵 Processing audio file: ${file.name}...`, "user");
    showTyping();

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Transcription failed");
      }

      const data = await res.json();
      hideTyping();

      if (data.transcription) {
        appendMessage(`📝 Transcription: ${data.transcription}`, "bot");
        if (data.response) {
          appendMessage(data.response, "bot");
        }
        
        // Mark as completed
        const fileItem = uploadedFiles.find(item => item.file === file);
        if (fileItem) {
          fileItem.status = 'completed';
          updateUploadList();
        }
        
        clearCurrentFile();
      } else {
        appendMessage("❌ Could not transcribe audio", "bot");
      }
    } catch (err) {
      hideTyping();
      appendMessage(`❌ Error: ${err.message}`, "bot");
    }
  }

  // Global function for removing files
  window.removeUploadedFile = function(id) {
    uploadedFiles = uploadedFiles.filter(item => item.id !== id);
    updateUploadList();
  };

  // Load session history from server
  async function loadSessionHistory() {
    try {
      const res = await fetch('/session-history', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        chatHistory = data.history || [];
        if (chatHistory.length > 0) {
          loadChatHistory();
        }
      }
    } catch (err) {
      console.error('[chat] Failed to load session history:', err);
    }
  }

  // Initialize
  console.log("[chat] Chat interface ready");
  
  // Load session history first, then show welcome message if empty
  loadSessionHistory().then(() => {
    if (chatHistory.length === 0) {
      appendMessage("👋 Welcome to VoiceVibe! I'm your AI assistant. How can I help you today?", "bot");
    }
    input.focus();
  });
});