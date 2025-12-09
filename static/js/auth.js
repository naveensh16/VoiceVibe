// static/js/auth.js
// Handles login and registration forms. Uses server-side sessions (no token storage needed).
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  async function sendJson(url, payload) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",  // Send cookies with request
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.error("Network error:", err);
      return { ok: false, status: 0, data: { error: "Network error" } };
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = (document.getElementById("login-username").value || "").trim();
      const password = (document.getElementById("login-password").value || "").trim();
      if (!username || !password) return alert("Enter username and password");

      const { ok, status, data } = await sendJson("/login", { username, password });
      console.log("[auth] login response", status, data);

      if (ok && data.success) {
        console.log("[auth] Login successful, session created");
        window.location.href = "/chat-ui";
      } else {
        alert(data.error || "Login failed");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = (document.getElementById("register-username").value || "").trim();
      const password = (document.getElementById("register-password").value || "").trim();
      if (!username || !password) return alert("Enter username and password");

      const { ok, status, data } = await sendJson("/register", { username, password });
      console.log("[auth] register response", status, data);

      if (ok && data.success) {
        console.log("[auth] Registration successful, session created");
        window.location.href = "/chat-ui";
      } else {
        alert(data.error || "Registration failed");
      }
    });
  }

});

