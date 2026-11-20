(function () {
  const top = document.querySelector("#viewBuilder .top");
  const sendBtn = document.createElement("button");
  sendBtn.className = "primary";
  sendBtn.textContent = "Send...";
  top.appendChild(sendBtn);

  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;place-items:center;z-index:50;padding:12px";
  overlay.innerHTML =
    '<div style="background:#2b2d31;border-radius:12px;padding:18px;width:min(420px,100%);max-height:90vh;overflow:auto">' +
    '<h2 style="margin:0 0 6px">Send to Discord</h2>' +
    '<label>Server</label><select id="sendGuild"></select>' +
    '<label>Channel</label><select id="sendChannel"></select>' +
    '<p id="sendStatus" class="muted" style="min-height:20px"></p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    '<button class="primary" id="sendPost">Post as new</button>' +
    '<button id="sendUpdate">Update posted message</button>' +
    '<button id="sendClose">Close</button></div></div>';
  document.body.appendChild(overlay);

  const gSel = document.getElementById("sendGuild");
  const cSel = document.getElementById("sendChannel");
  const status = document.getElementById("sendStatus");
  const postBtn = document.getElementById("sendPost");
  const updateBtn = document.getElementById("sendUpdate");
  let fresh = null;

  function setStatus(text) { status.textContent = text; }

  function refreshButtons() {
    updateBtn.disabled = !(fresh && fresh.posted_message_id);
    updateBtn.style.opacity = updateBtn.disabled ? "0.5" : "1";
  }

  async function loadChannels(guildId, wanted) {
    cSel.innerHTML = "<option>Loading...</option>";
    try {
      const chans = await api("/guilds/" + guildId + "/channels");
      if (!chans.length) {
        cSel.innerHTML = "<option value=''>No channel the bot can write in</option>";
        return;
      }
      cSel.innerHTML = chans.map((c) =>
        '<option value="' + c.id + '">#' + esc(c.name) + (c.category ? " (" + esc(c.category) + ")" : "") + "</option>"
      ).join("");
      if (wanted && chans.some((c) => c.id === wanted)) cSel.value = wanted;
    } catch (e) {
      if (e.message !== "login") setStatus(e.message);
    }
  }

  gSel.onchange = () => loadChannels(gSel.value, null);

  sendBtn.onclick = async () => {
    const probs = findProblems();
    if (probs.length) { alert("Fix this first: " + probs[0]); return; }
    await save();
    if (dirty || !cur.id) return;
    try {
      fresh = await api("/messages/" + cur.id);
      const guilds = await api("/guilds");
      if (!guilds.length) { alert("The bot isn't in any server."); return; }
      gSel.innerHTML = guilds.map((g) => '<option value="' + g.id + '">' + esc(g.name) + "</option>").join("");
      if (fresh.guild_id && guilds.some((g) => g.id === fresh.guild_id)) gSel.value = fresh.guild_id;
      setStatus(fresh.posted_message_id ? "Already posted once. You can update it or post a new copy." : "Not posted yet.");
      refreshButtons();
      overlay.style.display = "grid";
      await loadChannels(gSel.value, fresh.channel_id);
    } catch (e) {
      if (e.message !== "login") alert(e.message);
    }
  };

  async function send(path, withTarget) {
    setStatus("Sending...");
    postBtn.disabled = true;
    updateBtn.disabled = true;
    try {
      const opts = { method: "POST" };
      if (withTarget) opts.body = JSON.stringify({ guild_id: gSel.value, channel_id: cSel.value });
      fresh = await api("/messages/" + cur.id + path, opts);
      setStatus("Done! Check Discord.");
    } catch (e) {
      if (e.message !== "login") setStatus("Failed: " + e.message);
    }
    postBtn.disabled = false;
    refreshButtons();
  }

  postBtn.onclick = () => send("/post", true);
  updateBtn.onclick = () => send("/update", false);
  document.getElementById("sendClose").onclick = () => { overlay.style.display = "none"; };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.style.display = "none"; };
})();
