/*
 * account.js — shared "Account settings" modal for the guard and admin pages.
 *
 * Lets the logged-in user change their own username and/or password after
 * confirming their current password (verified server-side at POST /api/account).
 * Include with  <script src="account.js"></script>  and put a trigger element
 * with id="account-btn" in the page; this script gives it an icon and wires it.
 */
(function () {
  const API = location.protocol === "file:" ? "http://127.0.0.1:5000" : "";

  function setup() {
    if (document.getElementById("acc-modal")) return; // guard against double-load

    const style = document.createElement("style");
    style.textContent = `
      .acc-modal{position:fixed;inset:0;background:rgba(5,9,18,.7);display:none;align-items:center;justify-content:center;z-index:50}
      .acc-modal.show{display:flex}
      .acc-sheet{width:380px;max-width:92vw;background:var(--panel);border:1px solid var(--line2);border-radius:18px;padding:22px;font-family:Inter,system-ui,Arial,sans-serif;color:var(--txt)}
      .acc-sheet h3{margin:0 0 4px;font-size:18px;font-weight:700}
      .acc-sheet p{margin:0 0 16px;font-size:12px;color:var(--mut)}
      .acc-field{margin-bottom:12px}
      .acc-field label{font-size:12px;color:var(--mut);display:block;margin-bottom:5px}
      .acc-field input{width:100%;height:42px;background:var(--bg);border:1px solid var(--line2);color:var(--txt);border-radius:10px;padding:0 12px;font-size:15px;font-family:inherit;outline:none}
      .acc-field input:focus{border-color:var(--cyan)}
      .acc-msg{display:none;margin:2px 0 12px;font-size:13px;padding:10px 12px;border-radius:10px}
      .acc-msg.show{display:block}
      .acc-msg.ok{background:rgba(52,211,153,.12);color:var(--green);border:1px solid rgba(52,211,153,.4)}
      .acc-msg.err{background:rgba(251,113,133,.12);color:var(--red);border:1px solid rgba(251,113,133,.45)}
      .acc-acts{display:flex;gap:10px;justify-content:flex-end;margin-top:6px}
      .acc-btn{height:42px;padding:0 18px;border-radius:11px;border:1px solid var(--line2);background:transparent;color:var(--txt);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
      .acc-btn.primary{background:var(--cyan);border-color:var(--cyan);color:#06283d}
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.className = "acc-modal";
    modal.id = "acc-modal";
    modal.innerHTML = `
      <div class="acc-sheet">
        <h3>Account settings</h3>
        <p>Confirm your current password to change your username or password.</p>
        <div class="acc-field"><label>Current password</label><input id="acc-cur" type="password" autocomplete="current-password"/></div>
        <div class="acc-field"><label>New username</label><input id="acc-user" autocomplete="username"/></div>
        <div class="acc-field"><label>New password <span style="color:var(--dim)">(leave blank to keep)</span></label><input id="acc-new" type="password" autocomplete="new-password"/></div>
        <div class="acc-field"><label>Confirm new password</label><input id="acc-new2" type="password" autocomplete="new-password"/></div>
        <div class="acc-msg" id="acc-msg"></div>
        <div class="acc-acts"><button class="acc-btn" id="acc-cancel">Cancel</button><button class="acc-btn primary" id="acc-save">Save changes</button></div>
      </div>`;
    document.body.appendChild(modal);

    const $ = (id) => document.getElementById(id);
    const msg = (kind, t) => { const m = $("acc-msg"); m.className = "acc-msg show " + kind; m.textContent = t; };
    const clearMsg = () => { $("acc-msg").className = "acc-msg"; };

    async function open() {
      clearMsg();
      $("acc-cur").value = ""; $("acc-new").value = ""; $("acc-new2").value = ""; $("acc-user").value = "";
      try {
        const r = await fetch(API + "/api/me", { credentials: "same-origin" });
        if (r.ok) { const me = await r.json(); $("acc-user").value = me.username || ""; }
      } catch (e) { /* prefill is best-effort */ }
      modal.classList.add("show");
      setTimeout(() => $("acc-cur").focus(), 50);
    }
    function close() { modal.classList.remove("show"); }

    async function save() {
      clearMsg();
      const cur = $("acc-cur").value;
      const user = $("acc-user").value.trim();
      const np = $("acc-new").value, np2 = $("acc-new2").value;
      if (!cur) { msg("err", "Enter your current password."); return; }
      if (np && np !== np2) { msg("err", "The new passwords do not match."); return; }
      if (!user && !np) { msg("err", "Enter a new username or a new password."); return; }
      const body = { current_password: cur };
      if (user) body.new_username = user;
      if (np) body.new_password = np;
      try {
        const r = await fetch(API + "/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(body),
        });
        if (r.status === 401) { location.replace("index.html"); return; }
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { msg("err", d.error || "Could not update your account."); return; }
        msg("ok", "Saved — your credentials are updated.");
        $("acc-cur").value = ""; $("acc-new").value = ""; $("acc-new2").value = "";
      } catch (e) { msg("err", "Could not reach the server."); }
    }

    $("acc-cancel").onclick = close;
    $("acc-save").onclick = save;
    modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
    modal.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); if (e.key === "Escape") close(); });

    const btn = document.getElementById("account-btn");
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.125em"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
      btn.onclick = open;
    }
    window.openAccountModal = open;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();
