const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud".replace(/\/+$/, "");
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ic = (n) => '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"></use></svg>';

function btnData(e) {
  const b = e.target.closest("button");
  return b ? b.dataset : {};
}

function saveToken(t) { try { localStorage.setItem("token", t); } catch (e) {} }
function loadToken() { try { return localStorage.getItem("token"); } catch (e) { return null; } }
function clearToken() { try { localStorage.removeItem("token"); } catch (e) {} }

let loginError = "";
if (location.hash.startsWith("#token=")) {
  const parts = new URLSearchParams(location.hash.slice(1));
  let expected = null;
  try { expected = localStorage.getItem("login_nonce"); localStorage.removeItem("login_nonce"); } catch (e) {}
  if (expected && parts.get("n") === expected) saveToken(parts.get("token"));
  else loginError = "Login check failed. Please log in again.";
  history.replaceState(null, "", location.pathname);
} else if (location.hash.startsWith("#error=")) {
  loginError = "You need to be an Administrator of a server where this bot is installed.";
  history.replaceState(null, "", location.pathname);
}

function show(name) {
  for (const v of ["viewLogin", "viewLibrary", "viewBuilder", "viewAdmin"]) {
    $(v).classList.toggle("hidden", v !== name);
  }
}

async function api(path, opts = {}) {
  const res = await fetch(API_URL + path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
      Authorization: "Bearer " + loadToken(),
    },
  });
  if (res.status === 401) {
    clearToken();
    show("viewLogin");
    $("loginMsg").textContent = "Login expired. Please log in again.";
    throw new Error("login");
  }
  if (!res.ok) {
    let m = "Error " + res.status;
    try { const j = await res.json(); if (j.detail) m = j.detail; } catch (e) {}
    throw new Error(m);
  }
  return res.json();
}

function downloadJson(name, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = String(name).replace(/[^\w\-]+/g, "_").slice(0, 60) + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let cur = null;
let isOwner = false;
let selId = null;
let tab = "main";
let dirty = false;
let editCount = 0;
let saving = false;
let autosaveTimer = null;
let guilds = [];
let roles = [];
let chans = [];
let emojiData = null;
let emojiCb = null;
let dragId = null;
let undoStack = [];
let redoStack = [];
let lastState = "";
let burst = false;
let burstTimer = null;
let restoring = false;
let pane = "preview";
let pv = "dark";
let pw = "wide";
let mode = "edit";
let varTestValues = {};
let varPlayOpen = true;
try { pv = localStorage.getItem("pv") === "light" ? "light" : "dark"; } catch (e) {}
try { pw = localStorage.getItem("pw") === "phone" ? "phone" : "wide"; } catch (e) {}
const uid = () => Math.random().toString(36).slice(2, 8);
const NAMES = {
  text: "Text", section: "Text + side", images: "Images", divider: "Divider",
  box: "Box", button_row: "Buttons", dropdown: "Dropdown", embed: "Embed",
};
const TYPE_ICON = {
  text: "text", section: "section", images: "images", divider: "divider",
  box: "box", button_row: "buttons", dropdown: "dropdown", embed: "section",
};

window.addEventListener("beforeunload", (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ""; }
});

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function opts(list, selected) {
  return list.map((o) =>
    '<option value="' + esc(o[0]) + '"' + (o[0] === selected ? " selected" : "") + ">" + esc(o[1]) + "</option>"
  ).join("");
}

function guildName(id) {
  const g = guilds.find((x) => x.id === String(id));
  return g ? g.name : "Unknown server";
}

function emojiUrl(e) {
  return "https://cdn.discordapp.com/emojis/" + encodeURIComponent(e.id) + "." + (e.animated ? "gif" : "png");
}

const BUILTIN_VARS = [
  ["User (in replies & DMs)", [
    ["userid", "User ID", "123456789012345678"],
    ["username", "Username", "shivanshu"],
    ["usertag", "User tag", "shivanshu"],
    ["usermention", "Mentions user", "@Shivanshu"],
    ["userglobalnickname", "Display name", "Shivanshu"],
    ["usernickname", "Server nickname", "Shivanshu"],
  ]],
  ["Server & Channel", [
    ["servername", "Server name", ""],
    ["serverid", "Server ID", "987654321098765432"],
    ["membercount", "Member count", "142"],
    ["channelname", "Channel name", "announcements"],
    ["channelid", "Channel ID", "112233445566778899"],
    ["channelmention", "Mentions channel", "#announcements"],
  ]],
  ["Date & Time", [
    ["date", "Current UTC date", "2026-11-24"],
    ["time", "Current UTC time", "18:20 UTC"],
    ["timestamp", "Discord timestamp", "Today at 6:20 PM"],
  ]],
];

function subVarText(s) {
  if (!cur || !cur.layout) return String(s);
  const map = {};
  BUILTIN_VARS.forEach(([, items]) => {
    items.forEach(([k, , sample]) => {
      map[k] = k === "servername" ? guildName(cur.layout.guild_id) : sample;
    });
  });
  const defs = cur.layout.variables || [];
  defs.forEach((v) => {
    const val = varTestValues[v.name] !== undefined ? varTestValues[v.name] : v.default;
    if (val !== undefined && val !== "") map[v.name] = val;
  });
  return String(s).replace(/\{\{([A-Za-z0-9_]{1,32})\}\}/g, (m, name) =>
    map[name] !== undefined ? map[name] : m
  );
}

function inline(s) {
  s = subVarText(s);
  s = esc(s);
  s = s.replace(/&lt;(a?):(\w+):(\d+)&gt;/g, (m, a, n, id) =>
    '<img class="emoji" src="https://cdn.discordapp.com/emojis/' + id + "." + (a ? "gif" : "png") + '" alt=":' + n + ':">');
  s = s.replace(/`([^`]+?)`/g, "<code>$1</code>");
  s = s.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
  s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  s = s.replace(/__(.+?)__/g, "<u>$1</u>");
  s = s.replace(/\*(.+?)\*/g, "<i>$1</i>");
  s = s.replace(/~~(.+?)~~/g, "<s>$1</s>");
  s = s.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a class="dl" href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/\{\{([A-Za-z0-9_]{1,32})\}\}/g, '<span class="vartok">{{$1}}</span>');
  return s;
}

function md(text) {
  return text.split("\n").map((line) => {
    if (line.startsWith("### ")) return "<h3>" + inline(line.slice(4)) + "</h3>";
    if (line.startsWith("## ")) return "<h2>" + inline(line.slice(3)) + "</h2>";
    if (line.startsWith("# ")) return "<h1>" + inline(line.slice(2)) + "</h1>";
    if (line.startsWith("-# ")) return '<p class="dm" style="font-size:12px">' + inline(line.slice(3)) + "</p>";
    if (line.startsWith("- ")) return "<p>&bull; " + inline(line.slice(2)) + "</p>";
    return "<p>" + (inline(line) || "&nbsp;") + "</p>";
  }).join("");
}

/* ---------- Phone panes and preview theme ---------- */
function isMobile() { return window.matchMedia("(max-width: 900px)").matches; }

function setPane(p) {
  pane = p;
  $("builderEl").dataset.pane = p;
  document.querySelectorAll(".botbar button").forEach((b) => b.classList.toggle("on", b.dataset.pane === p));
}

document.querySelector(".botbar").addEventListener("click", (e) => {
  const d = btnData(e);
  if (!d.pane) return;
  setPane(d.pane === pane && d.pane !== "preview" ? "preview" : d.pane);
});

let treeOpen = false;
function applyTree() {
  $("builderEl").dataset.tree = treeOpen ? "open" : "closed";
  $("treeBtn").classList.toggle("on", treeOpen);
  $("treeEdge").textContent = treeOpen ? "‹" : "›";
  positionFloatBar();
}
$("treeBtn").onclick = () => { treeOpen = !treeOpen; applyTree(); };
$("treeEdge").onclick = () => { treeOpen = !treeOpen; applyTree(); };

/* ---------- Edit / Test mode ---------- */
let testRoles = new Set();
let testPageIdx = 0;
let toastTimer = null;

function toast(text) {
  const t = $("testToast");
  t.textContent = text;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2800);
}

function notify(text, kind) {
  kind = kind || "info";
  const box = $("toasts");
  [...box.children].filter((n) => n.dataset.text === text).forEach((n) => n.remove());
  const n = document.createElement("div");
  n.className = "toast " + kind;
  n.dataset.text = text;
  n.setAttribute("role", kind === "error" ? "alert" : "status");
  n.title = "Tap to dismiss";
  n.textContent = text;
  n.onclick = () => n.remove();
  box.appendChild(n);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => n.remove(), kind === "error" ? 7000 : 3200);
}

function notifyErr(text) { notify(text, "error"); }

/* ---------- Custom confirm & prompt modals (Phase 2.6) ---------- */
let dialogResolve = null;
function closeDialog(val) {
  $("dialogOverlay").classList.add("hidden");
  if (dialogResolve) {
    const r = dialogResolve;
    dialogResolve = null;
    r(val);
  }
}
function uiConfirm(msg, opts = {}) {
  if (dialogResolve) closeDialog(false);
  $("dialogTitle").textContent = opts.title || "Please confirm";
  $("dialogMsg").textContent = msg;
  $("dialogMsg").classList.remove("hidden");
  $("dialogInput").classList.add("hidden");
  $("dialogOk").textContent = opts.okText || "Confirm";
  $("dialogOk").className = opts.danger ? "danger" : "primary";
  $("dialogCancel").textContent = opts.cancelText || "Cancel";
  $("dialogOverlay").classList.remove("hidden");
  $("dialogOk").focus();
  return new Promise((res) => { dialogResolve = res; });
}
function uiPrompt(title, defVal = "", msg = "") {
  if (dialogResolve) closeDialog(null);
  $("dialogTitle").textContent = title;
  $("dialogMsg").textContent = msg;
  $("dialogMsg").classList.toggle("hidden", !msg);
  const inp = $("dialogInput");
  inp.classList.remove("hidden");
  inp.value = defVal;
  $("dialogOk").textContent = "Save";
  $("dialogOk").className = "primary";
  $("dialogCancel").textContent = "Cancel";
  $("dialogOverlay").classList.remove("hidden");
  inp.focus();
  inp.select();
  return new Promise((res) => { dialogResolve = (ok) => res(ok ? inp.value : null); });
}
$("dialogOk").onclick = () => closeDialog(true);
$("dialogCancel").onclick = () => closeDialog(false);
$("dialogOverlay").onclick = (e) => { if (e.target === $("dialogOverlay")) closeDialog(false); };
$("dialogInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); closeDialog(true); }
});

function testShow(html) {
  $("testPanel").innerHTML = html;
  $("testPanel").classList.remove("hidden");
}

function testClear() {
  $("testPanel").innerHTML = "";
  $("testPanel").classList.add("hidden");
}

function setMode(m) {
  mode = m;
  testRoles = new Set();
  testPageIdx = 0;
  testClear();
  hideAddMenu();
  $("testToast").classList.add("hidden");
  document.querySelectorAll("[data-mode]").forEach((b) => b.classList.toggle("on", b.dataset.mode === mode));
  $("discordBox").classList.toggle("testing", mode === "test");
  renderPreview();
}

document.querySelector(".pvhead").addEventListener("click", (e) => {
  const m = btnData(e).mode;
  if (m && m !== mode) setMode(m);
});

function allBlocks() {
  const out = [];
  const walk = (list) => list.forEach((b) => {
    out.push(b);
    if (b.type === "box") walk(b.children);
  });
  walk(cur.layout.blocks);
  cur.layout.replies.forEach((r) => walk(r.blocks));
  return out;
}

function testFindBtn(id) {
  for (const b of allBlocks()) {
    if (b.type === "button_row") {
      const x = b.buttons.find((y) => y.id === id);
      if (x) return x;
    }
    if (b.type === "section" && b.side === "button" && b.button && b.button.id === id) return b.button;
  }
  return null;
}

function testDropdown(blockId) {
  const b = allBlocks().find((x) => x.id === blockId);
  if (!b) return;
  testShow('<div class="dm" style="margin-bottom:6px">Dropdown options <button class="small" data-tclose="1" style="margin-left:8px">Close</button></div>' +
    b.options.map((o) =>
      '<div class="topt" data-opt="' + esc(o.id) + '" data-blk="' + esc(b.id) + '">' +
      (o.emoji ? '<img class="emoji" src="' + emojiUrl(o.emoji) + '" alt="">' : "") +
      "<span>" + esc(o.label) + "</span>" +
      (o.description ? '<span class="tdesc">' + esc(o.description) + "</span>" : "") + "</div>"
    ).join(""));
}

function testRun(a) {
  if (!a) return;
  if (a.type === "link") {
    const url = String(a.url || "").trim();
    if (url.startsWith("https://")) window.open(url, "_blank", "noopener");
    else toast("This link must start with https://");
    return;
  }
  if (a.type === "reply") {
    const r = cur.layout.replies.find((x) => x.id === a.reply_id);
    if (!r) { toast("No reply is chosen for this."); return; }
    testShow('<div class="dm" style="margin-bottom:6px">Only you can see this <button class="small" data-tclose="1" style="margin-left:8px">Dismiss</button></div>' +
      r.blocks.map(renderBlock).join(""));
    return;
  }
  if (a.type === "form") {
    const f = cur.layout.forms.find((x) => x.id === a.form_id);
    if (!f) { toast("No form is chosen for this."); return; }
    testShow('<div class="dm" style="margin-bottom:6px">Pop-up form <button class="small" data-tclose="1" style="margin-left:8px">Close</button></div>' +
      renderFormPreview(f).replace('<span class="pbtn blue">',
        '<span class="pbtn blue" data-tsubmit="' + esc(f.id) + '" style="cursor:pointer">'));
    return;
  }
  if (a.type === "role") {
    const role = roles.find((x) => x.id === a.role_id);
    if (!role) { toast("That role doesn't exist any more."); return; }
    if (!role.assignable) { toast("I can't manage that role. My role must be above it in Server Settings."); return; }
    const has = testRoles.has(role.id);
    let m = a.mode || "toggle";
    if (m === "toggle") m = has ? "remove" : "add";
    if (m === "add") {
      if (has) { toast("You already have the " + role.name + " role."); return; }
      testRoles.add(role.id);
      toast("Added the " + role.name + " role.");
    } else {
      if (!has) { toast("You don't have the " + role.name + " role."); return; }
      testRoles.delete(role.id);
      toast("Removed the " + role.name + " role.");
    }
    return;
  }
  if (a.type === "page") {
    const pages = cur.layout.pages || [];
    const total = 1 + pages.length;
    if (total <= 1) { toast("Add a page with + Page first."); return; }
    const req = Number(a.page_index ?? -2);
    if (req === -2) testPageIdx = (testPageIdx + 1) % total;
    else if (req === -1) testPageIdx = (testPageIdx - 1 + total) % total;
    else testPageIdx = Math.max(0, Math.min(req, total - 1));
    const oldBlocks = cur.layout.blocks;
    const oldContent = cur.layout.content;
    const oldEmbeds = cur.layout.embeds;
    if (testPageIdx > 0) {
      const p = pages[testPageIdx - 1];
      if (isClassic()) {
        cur.layout.content = p.content || "";
        cur.layout.embeds = p.embeds || [];
      } else {
        const hasNav = (blks) => blks.some((b) =>
          (b.type === "button_row" && b.buttons.some((x) => x.action && x.action.type === "page")) ||
          (b.type === "dropdown" && b.options.some((o) => o.action && o.action.type === "page")) ||
          (b.type === "box" && hasNav(b.children || []))
        );
        const navRows = (blks) => {
          let r = [];
          blks.forEach((b) => {
            if (b.type === "button_row" && b.buttons.some((x) => x.action && x.action.type === "page")) r.push(b);
            else if (b.type === "dropdown" && b.options.some((o) => o.action && o.action.type === "page")) r.push(b);
            else if (b.type === "box") r = r.concat(navRows(b.children || []));
          });
          return r;
        };
        const pb = (p.blocks || []).slice();
        if (!hasNav(pb)) pb.push(...navRows(oldBlocks));
        cur.layout.blocks = pb;
      }
    }
    $("preview").innerHTML = isClassic() ? renderClassicPreview() : cur.layout.blocks.map(renderBlock).join("");
    cur.layout.blocks = oldBlocks;
    cur.layout.content = oldContent;
    cur.layout.embeds = oldEmbeds;
    toast("Page " + (testPageIdx + 1) + " / " + total);
  }
}

function testClick(e) {
  e.preventDefault();
  if (e.target.closest("[data-tclose]")) { testClear(); return; }
  const sub = e.target.closest("[data-tsubmit]");
  if (sub) {
    const f = cur.layout.forms.find((x) => x.id === sub.dataset.tsubmit);
    const c = f ? chans.find((x) => x.id === f.channel_id) : null;
    testShow('<div class="dm" style="margin-bottom:6px">Only you can see this <button class="small" data-tclose="1" style="margin-left:8px">Dismiss</button></div>' +
      "<p>" + esc((f && f.thanks) || "Thanks! Your response was sent.") + "</p>" +
      '<div class="dm">(Test: answers would be posted in ' + (c ? "#" + esc(c.name) : "the chosen channel") + ".)</div>");
    return;
  }
  const opt = e.target.closest("[data-opt]");
  if (opt) {
    const blk = allBlocks().find((x) => x.id === opt.dataset.blk);
    const o = blk && blk.options.find((y) => y.id === opt.dataset.opt);
    if (o) testRun(o.action);
    return;
  }
  const bt = e.target.closest("[data-btn]");
  if (bt) { testRun((testFindBtn(bt.dataset.btn) || {}).action); return; }
  const dd = e.target.closest("[data-dd]");
  if (dd) testDropdown(dd.dataset.dd);
}

$("testPanel").addEventListener("click", testClick);

function applyPv() {
  $("discordBox").classList.toggle("light", pv === "light");
  document.querySelectorAll("[data-pv]").forEach((b) => b.classList.toggle("on", b.dataset.pv === pv));
}

function applyPw() {
  $("discordBox").classList.toggle("phonepv", pw === "phone");
  document.querySelectorAll("[data-pw]").forEach((b) => b.classList.toggle("on", b.dataset.pw === pw));
  positionFloatBar();
}

document.querySelector(".pvhead").addEventListener("click", (e) => {
  const d = btnData(e);
  if (d.pv) {
    pv = d.pv;
    try { localStorage.setItem("pv", pv); } catch (err) {}
    applyPv();
  }
  if (d.pw) {
    pw = d.pw;
    try { localStorage.setItem("pw", pw); } catch (err) {}
    applyPw();
  }
});

/* ---------- History (undo / redo) and autosave ---------- */
function resetHistory() {
  undoStack = [];
  redoStack = [];
  lastState = JSON.stringify(cur.layout);
  burst = false;
  updateUndoButtons();
}

function updateUndoButtons() {
  $("undoBtn").disabled = !undoStack.length;
  $("redoBtn").disabled = !redoStack.length;
}

function markDirty() {
  dirty = true;
  editCount += 1;
  if (!restoring) {
    const now = JSON.stringify(cur.layout);
    if (now !== lastState) {
      if (!burst) {
        undoStack.push(lastState);
        if (undoStack.length > 60) undoStack.shift();
        redoStack = [];
      }
      burst = true;
      clearTimeout(burstTimer);
      burstTimer = setTimeout(() => { burst = false; }, 700);
      lastState = now;
    }
  }
  scheduleAutosave();
  updateUndoButtons();
}

function restore(state) {
  restoring = true;
  cur.layout = normalize(JSON.parse(state));
  lastState = state;
  burst = false;
  selId = null;
  if (tab !== "main" && tab !== "__vars" && !activeReply() && !activeForm() && !activePage()) tab = "main";
  if (cur.layout.guild_id) $("guildSel").value = cur.layout.guild_id;
  markDirty();
  restoring = false;
  updateUndoButtons();
  renderAll();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(lastState);
  restore(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(lastState);
  restore(redoStack.pop());
}

$("undoBtn").onclick = undo;
$("redoBtn").onclick = redo;

function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  if (!cur || !cur.id) return;
  autosaveTimer = setTimeout(() => { if (dirty) save(true); }, 6000);
}

/* ---------- Emoji picker ---------- */
async function loadEmojis() {
  if (emojiData) return;
  try { emojiData = await api("/emojis"); } catch (e) { emojiData = []; }
}

function loadRecentEmojis() {
  try {
    const raw = JSON.parse(localStorage.getItem("recent_emojis") || "[]");
    return Array.isArray(raw) ? raw.filter((e) => e && e.id && e.name) : [];
  } catch (e) { return []; }
}

function saveRecentEmoji(em) {
  try {
    const prev = loadRecentEmojis().filter((e) => e.id !== em.id);
    prev.unshift({ id: em.id, name: em.name, animated: !!em.animated });
    localStorage.setItem("recent_emojis", JSON.stringify(prev.slice(0, 16)));
  } catch (e) {}
}

function emojiGridHtml(list) {
  return '<div class="eg">' + list.map((e) =>
    '<button data-eid="' + esc(e.id) + '" data-ename="' + esc(e.name) + '" data-eanim="' + (e.animated ? "1" : "0") +
    '" title=":' + esc(e.name) + ':"><img loading="lazy" src="' + emojiUrl(e) + '" alt=""></button>'
  ).join("") + "</div>";
}

function drawEmojiList() {
  const q = $("emojiSearch").value.trim().toLowerCase();
  let html = "";
  const recent = loadRecentEmojis().filter((e) => !q || e.name.toLowerCase().includes(q));
  if (recent.length) {
    html += '<div class="muted" style="margin:8px 0 4px">Recently used</div>' + emojiGridHtml(recent);
  }
  (emojiData || []).forEach((g) => {
    const list = g.emojis.filter((e) => !q || e.name.toLowerCase().includes(q));
    if (!list.length) return;
    html += '<div class="muted" style="margin:8px 0 4px">' + esc(g.guild_name) + '</div>' + emojiGridHtml(list);
  });
  $("emojiList").innerHTML = html || '<p class="muted">No custom emojis found in your servers.</p>';
}

async function pickEmoji(cb) {
  emojiCb = cb;
  await loadEmojis();
  $("emojiSearch").value = "";
  drawEmojiList();
  $("emojiOverlay").classList.remove("hidden");
}

$("emojiSearch").oninput = drawEmojiList;
$("emojiClose").onclick = () => { emojiCb = null; $("emojiOverlay").classList.add("hidden"); };
$("emojiOverlay").onclick = (e) => {
  if (e.target === $("emojiOverlay")) { emojiCb = null; $("emojiOverlay").classList.add("hidden"); }
};
$("emojiList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-eid]");
  if (!btn || !emojiCb) return;
  const picked = { id: btn.dataset.eid, name: btn.dataset.ename, animated: btn.dataset.eanim === "1" };
  saveRecentEmoji(picked);
  const cb = emojiCb;
  emojiCb = null;
  $("emojiOverlay").classList.add("hidden");
  cb(picked);
});

function insertIntoField(selector, text) {
  const el = document.querySelector(selector);
  if (!el) return;
  const s = el.selectionStart === undefined ? el.value.length : el.selectionStart;
  const t = el.selectionEnd === undefined ? s : el.selectionEnd;
  el.value = el.value.slice(0, s) + text + el.value.slice(t);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/* ---------- Text toolbar ---------- */
function autoGrow(el) {
  if (!el || el.tagName !== "TEXTAREA") return;
  el.style.height = "auto";
  const maxH = Math.max(160, Math.round(window.innerHeight * 0.45));
  const next = Math.min(el.scrollHeight + 2, maxH);
  el.style.height = next + "px";
  el.style.overflowY = el.scrollHeight + 2 > maxH ? "auto" : "hidden";
}

function growAllTextareas() {
  $("settings").querySelectorAll("textarea").forEach(autoGrow);
}

function fmtBar() {
  const b = (k, t, l) => '<button type="button" class="small" data-act2="fmt" data-fmt="' + k + '" title="' + t + '">' + l + "</button>";
  return '<div class="fmtbar" role="toolbar" aria-label="Text formatting">' +
    '<div class="fmtrow">' +
    b("bold", "Bold", "<b>B</b>") +
    b("italic", "Italic", "<i>I</i>") +
    b("underline", "Underline", "<u>U</u>") +
    b("strike", "Strikethrough", "<s>S</s>") +
    b("code", "Inline code", "&lt;&gt;") +
    b("link", "Link", "Link") +
    '</div><div class="fmtrow">' +
    b("h1", "Big heading", "H1") +
    b("h2", "Heading", "H2") +
    b("spoiler", "Spoiler", "Spoiler") +
    b("small", "Small text", "Small") +
    '<div class="fmtvar-wrap"><button type="button" class="small" data-act2="fmtvar" title="Insert variable" aria-label="Insert variable" aria-expanded="false">{x} Var</button>' +
    '<div id="fmtVarMenu" class="fmtvar hidden">' +
    (((cur && cur.layout && cur.layout.variables) || []).length
      ? '<div class="fvh">Custom variables</div>' + cur.layout.variables.map((v) =>
          '<button type="button" class="small" data-act2="insertvar" data-vname="' + esc(v.name) + '"><b>{{' + esc(v.name) + '}}</b><span class="muted">' + esc(v.default || "") + '</span></button>'
        ).join("")
      : "") +
    BUILTIN_VARS.map(([grp, items]) =>
      '<div class="fvh">' + esc(grp) + '</div>' +
      items.map(([k, desc]) =>
        '<button type="button" class="small" data-act2="insertvar" data-vname="' + esc(k) + '"><b>' + esc(k) + '</b><span class="muted">' + esc(desc) + '</span></button>'
      ).join("")
    ).join("") +
    "</div></div></div></div>";
}

function formatText(kind) {
  const el = document.querySelector('#settings textarea[data-f="content"], #settings textarea[data-fmt-target]');
  if (!el) return;
  const v = el.value;
  const s = el.selectionStart;
  const t = el.selectionEnd;
  const wraps = {
    bold: ["**", "**"], italic: ["*", "*"], underline: ["__", "__"],
    strike: ["~~", "~~"], code: ["`", "`"], spoiler: ["||", "||"],
  };
  const prefixes = { h1: "# ", h2: "## ", small: "-# " };
  if (wraps[kind]) {
    const [a, z] = wraps[kind];
    const mid = v.slice(s, t) || "text";
    el.value = v.slice(0, s) + a + mid + z + v.slice(t);
    el.setSelectionRange(s + a.length, s + a.length + mid.length);
  } else if (kind === "link") {
    const mid = v.slice(s, t) || "link";
    el.value = v.slice(0, s) + "[" + mid + "](https://)" + v.slice(t);
    const u = s + mid.length + 3;
    el.setSelectionRange(u, u + 8);
  } else if (prefixes[kind]) {
    const start = v.lastIndexOf("\n", s - 1) + 1;
    let end = v.indexOf("\n", t);
    if (end < 0) end = v.length;
    const p = prefixes[kind];
    const out = v.slice(start, end).split("\n").map((ln) => {
      const had = ln.startsWith(p);
      return (had ? "" : p) + ln.replace(/^(#{1,3} |-# )/, "");
    }).join("\n");
    el.value = v.slice(0, start) + out + v.slice(end);
    el.setSelectionRange(start, start + out.length);
  }
  el.focus();
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function emojiRow(x, kind, i) {
  const shown = x.emoji
    ? '<img class="emoji" src="' + emojiUrl(x.emoji) + '" alt=""> <span class="muted">:' + esc(x.emoji.name) + ":</span>"
    : '<span class="muted">none</span>';
  return '<label>Emoji (optional)</label><div class="btnrow" style="align-items:center">' + shown +
    '<button class="small" data-act2="' + kind + 'emoji" data-i="' + i + '">' + ic("smile") + "Pick</button>" +
    (x.emoji ? '<button class="small" data-act2="' + kind + 'emojiclear" data-i="' + i + '">' + ic("close") + "Clear</button>" : "") + "</div>";
}

/* ---------- Data helpers ---------- */
function newButton() {
  return { id: uid(), label: "Button", style: "grey", action: { type: "link", url: "https://" }, allowed_roles: [], cooldown: 0, once: false };
}

function newOption() {
  return { id: uid(), label: "Option", description: "", action: { type: "reply", reply_id: "" }, allowed_roles: [], cooldown: 0, once: false };
}

function newField() {
  return { id: uid(), label: "Your answer", style: "short", placeholder: "", required: true };
}

function newBlock(type) {
  const id = uid();
  if (type === "text") return { id, type, content: "Write your text here" };
  if (type === "section") {
    const btn = newButton();
    btn.label = "Click";
    return { id, type, content: "**Title**\nSmall description goes here.", side: "button", button: btn, image: "" };
  }
  if (type === "images") return { id, type, urls: [""] };
  if (type === "divider") return { id, type, spacing: "small", line: true };
  if (type === "box") return { id, type, accent: "#5865F2", children: [] };
  if (type === "dropdown") return { id, type, placeholder: "Choose an option...", options: [newOption()] };
  return { id, type: "button_row", buttons: [newButton()] };
}

function fixButton(x) {
  if (!x.action) x.action = { type: "link", url: x.url || "https://" };
  if (!x.style) x.style = "grey";
  if (!Array.isArray(x.allowed_roles)) x.allowed_roles = [];
  if (!Number.isInteger(x.cooldown) || x.cooldown < 0) x.cooldown = 0;
  if (typeof x.once !== "boolean") x.once = false;
  delete x.url;
}

function normalize(layout) {
  if (!Array.isArray(layout.blocks)) layout.blocks = [];
  if (!Array.isArray(layout.replies)) layout.replies = [];
  if (!Array.isArray(layout.forms)) layout.forms = [];
  if (!Array.isArray(layout.pages)) layout.pages = [];
  if (!Array.isArray(layout.variables)) layout.variables = [];
  layout.variables = layout.variables.filter((v) => v && typeof v === "object").map((v) => ({ id: String(v.id || uid()), name: String(v.name || ""), default: String(v.default || "") }));
  if (layout.kind === "classic") {
    if (typeof layout.content !== "string") layout.content = "";
    if (!Array.isArray(layout.embeds)) layout.embeds = [];
    layout.embeds.forEach((e) => {
      const d = blankEmbed();
      Object.keys(d).forEach((k) => { if (e[k] === undefined) e[k] = d[k]; });
      if (!Array.isArray(e.fields)) e.fields = [];
    });
  }
  const fix = (b) => {
    if (b.type === "box") b.children.forEach(fix);
    if (b.type === "button_row") b.buttons.forEach(fixButton);
    if (b.type === "section") {
      if (!b.side) b.side = "button";
      if (!b.button) b.button = newButton();
      if (b.image === undefined) b.image = "";
      fixButton(b.button);
    }
    if (b.type === "dropdown") {
      if (!Array.isArray(b.options)) b.options = [];
      b.options.forEach((o) => {
        if (!o.action) o.action = { type: "reply", reply_id: "" };
        if (o.description === undefined) o.description = "";
        if (!Array.isArray(o.allowed_roles)) o.allowed_roles = [];
        if (!Number.isInteger(o.cooldown) || o.cooldown < 0) o.cooldown = 0;
        if (typeof o.once !== "boolean") o.once = false;
      });
    }
  };
  layout.blocks.forEach(fix);
  layout.replies.forEach((r) => {
    if (!Array.isArray(r.blocks)) r.blocks = [];
    r.blocks.forEach(fix);
  });
  layout.forms.forEach((f) => {
    if (!Array.isArray(f.fields)) f.fields = [];
  });
  layout.pages.forEach((pg) => {
    if (!Array.isArray(pg.blocks)) pg.blocks = [];
    pg.blocks.forEach(fix);
    if (typeof pg.content !== "string") pg.content = "";
    if (!Array.isArray(pg.embeds)) pg.embeds = [];
  });
  return layout;
}

function reid(x) {
  if (Array.isArray(x)) { x.forEach(reid); return; }
  if (x && typeof x === "object") {
    Object.keys(x).forEach((k) => {
      if (k === "emoji") return;
      if (k === "id" && typeof x[k] === "string") x[k] = uid();
      else reid(x[k]);
    });
  }
}

function activeReply() {
  if (tab === "main") return null;
  return cur.layout.replies.find((r) => r.id === tab) || null;
}

function activeForm() {
  if (tab === "main") return null;
  return cur.layout.forms.find((f) => f.id === tab) || null;
}

function activePage() {
  if (tab === "main") return null;
  return (cur.layout.pages || []).find((p) => p.id === tab) || null;
}

function activeBlocks() {
  const r = activeReply();
  if (r) return r.blocks;
  const p = activePage();
  return p ? p.blocks : cur.layout.blocks;
}

function addPage() {
  if (!Array.isArray(cur.layout.pages)) cur.layout.pages = [];
  if (cur.layout.pages.length >= 25) { toast("Max 25 pages."); return; }
  const idx = cur.layout.pages.length + 2;
  const p = { id: uid(), name: "Page " + idx, blocks: [], content: "", embeds: [] };
  if (!isClassic()) {
    const box = newBlock("box");
    box.children.push({ id: uid(), type: "text", content: "# Page " + idx + "\nWrite page content here." });
    p.blocks.push(box);
  } else {
    p.embeds.push(newEmbed());
  }
  cur.layout.pages.push(p);
  tab = p.id;
  selId = null;
  markDirty();
  renderAll();
}

function findLoc(id) {
  const top = activeBlocks();
  for (let i = 0; i < top.length; i++) {
    if (top[i].id === id) return { list: top, index: i, parent: null };
    if (top[i].type === "box") {
      const kids = top[i].children;
      for (let j = 0; j < kids.length; j++) {
        if (kids[j].id === id) return { list: kids, index: j, parent: top[i] };
      }
    }
  }
  return null;
}

function addBlock(type) {
  if (type === "embed") { addEmbed(); return; }
  const b = newBlock(type);
  const loc = selId ? findLoc(selId) : null;
  if (loc && type !== "box") {
    const sel = loc.list[loc.index];
    if (sel.type === "box") sel.children.push(b);
    else if (loc.parent) loc.list.splice(loc.index + 1, 0, b);
    else activeBlocks().push(b);
  } else {
    activeBlocks().push(b);
  }
  selId = b.id;
  markDirty();
  renderAll();
  if (isMobile()) setPane("settings");
}

function moveBlock(id, dir) {
  const loc = findLoc(id);
  if (!loc) return;
  const j = loc.index + dir;
  if (j < 0 || j >= loc.list.length) return;
  const tmp = loc.list[loc.index];
  loc.list[loc.index] = loc.list[j];
  loc.list[j] = tmp;
  markDirty();
  renderAll();
}

function removeBlock(id) {
  const loc = findLoc(id);
  if (!loc) return;
  loc.list.splice(loc.index, 1);
  if (selId === id) selId = null;
  markDirty();
  renderAll();
}

function dupBlock(id) {
  const loc = findLoc(id);
  if (!loc) return;
  const copy = JSON.parse(JSON.stringify(loc.list[loc.index]));
  reid(copy);
  loc.list.splice(loc.index + 1, 0, copy);
  selId = copy.id;
  markDirty();
  renderAll();
}

function dropBlock(srcId, targetId, where) {
  if (srcId === targetId) return;
  const src = findLoc(srcId);
  const tgt = findLoc(targetId);
  if (!src || !tgt) return;
  const moving = src.list[src.index];
  const target = tgt.list[tgt.index];
  if (moving.type === "box" && (tgt.parent || where === "into")) return;
  src.list.splice(src.index, 1);
  const t = findLoc(targetId);
  if (!t) return;
  if (where === "into" && target.type === "box") target.children.push(moving);
  else t.list.splice(t.index + (where === "after" ? 1 : 0), 0, moving);
  markDirty();
  renderAll();
}

function addReply() {
  const r = { id: uid(), name: "Reply " + (cur.layout.replies.length + 1), blocks: [] };
  const box = newBlock("box");
  box.children.push({ id: uid(), type: "text", content: "Write the private reply here." });
  r.blocks.push(box);
  cur.layout.replies.push(r);
  tab = r.id;
  selId = null;
  markDirty();
  renderAll();
}

function addForm() {
  const f = {
    id: uid(),
    name: "Form " + (cur.layout.forms.length + 1),
    title: "Application",
    channel_id: "",
    thanks: "Thanks! Your response was sent.",
    fields: [newField()],
  };
  cur.layout.forms.push(f);
  tab = f.id;
  selId = null;
  markDirty();
  renderAll();
}

function addField() {
  const f = activeForm();
  if (!f || f.fields.length >= 5) return;
  const q = newField();
  f.fields.push(q);
  selId = q.id;
  markDirty();
  renderAll();
  if (isMobile()) setPane("settings");
}

function moveField(id, dir) {
  const f = activeForm();
  if (!f) return;
  const i = f.fields.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= f.fields.length) return;
  const tmp = f.fields[i];
  f.fields[i] = f.fields[j];
  f.fields[j] = tmp;
  markDirty();
  renderAll();
}

function removeField(id) {
  const f = activeForm();
  if (!f) return;
  f.fields = f.fields.filter((x) => x.id !== id);
  if (selId === id) selId = null;
  markDirty();
  renderAll();
}

function dupField(id) {
  const f = activeForm();
  if (!f || f.fields.length >= 5) return;
  const i = f.fields.findIndex((x) => x.id === id);
  if (i < 0) return;
  const copy = JSON.parse(JSON.stringify(f.fields[i]));
  copy.id = uid();
  f.fields.splice(i + 1, 0, copy);
  selId = copy.id;
  markDirty();
  renderAll();
}

function dropField(srcId, targetId, where) {
  const f = activeForm();
  if (!f || srcId === targetId) return;
  const i = f.fields.findIndex((x) => x.id === srcId);
  if (i < 0) return;
  const moving = f.fields.splice(i, 1)[0];
  const j = f.fields.findIndex((x) => x.id === targetId);
  if (j < 0) { f.fields.splice(i, 0, moving); return; }
  f.fields.splice(j + (where === "after" ? 1 : 0), 0, moving);
  markDirty();
  renderAll();
}

function countComponents(blocks) {
  let n = 0;
  const one = (b) => {
    n += 1;
    if (b.type === "box") b.children.forEach(one);
    if (b.type === "button_row") n += b.buttons.length;
    if (b.type === "dropdown") n += 1;
    if (b.type === "section") n += 2;
  };
  blocks.forEach(one);
  return n;
}

function countChars(blocks) {
  let n = 0;
  const one = (b) => {
    if (b.type === "text" || b.type === "section") n += b.content.length;
    if (b.type === "box") b.children.forEach(one);
  };
  blocks.forEach(one);
  return n;
}

/* ---------- Problems (clickable list, red dots) ---------- */
function okUrl(u) {
  u = String(u || "").trim();
  return u.startsWith("https://") && u.length > 8;
}
let probKey = "";
let probList = [];
let bad = new Set();

function problemsFor(blocks, prefix, p, tabId) {
  const replyExists = (id) => cur.layout.replies.some((r) => r.id === id);
  const formExists = (id) => cur.layout.forms.some((f) => f.id === id);
  const add = (msg, id) => p.push({ msg: prefix + msg, blockId: id || null, tab: tabId, level: "error" });
  const checkAction = (a, who, id) => {
    if (a.type === "reply" && !replyExists(a.reply_id)) add("has " + who + " with no reply chosen", id);
    if (a.type === "form" && !formExists(a.form_id)) add("has " + who + " with no form chosen", id);
    if (a.type === "role" && !a.role_id) add("has " + who + " with no role chosen", id);
  };
  const checkButton = (x, who, id) => {
    if (!x.label.trim() && !x.emoji) add("has " + who + " with no label or emoji", id);
    if (x.action.type === "link" && !okUrl(x.action.url)) add("has " + who + " with a link not starting with https://", id);
    checkAction(x.action, who, id);
  };
  const check = (b) => {
    if (b.type === "text" && !b.content.trim()) add("has an empty text part", b.id);
    if (b.type === "section") {
      if (!b.content.trim()) add("has a Text + side part with no text", b.id);
      if (b.side === "thumbnail") {
        if (!okUrl(b.image)) add("has a thumbnail link not starting with https://", b.id);
      } else {
        checkButton(b.button, "a side button", b.id);
      }
    }
    if (b.type === "images") {
      const u = b.urls.filter((x) => x.trim());
      if (!u.length) add("has an image part with no link", b.id);
      if (u.some((x) => !okUrl(x))) add("has an image link not starting with https://", b.id);
      if (u.length > 10) add("has more than 10 images in one part", b.id);
    }
    if (b.type === "button_row") {
      if (!b.buttons.length) add("has an empty button row", b.id);
      if (b.buttons.length > 5) add("has more than 5 buttons in a row", b.id);
      b.buttons.forEach((x) => checkButton(x, "a button", b.id));
    }
    if (b.type === "dropdown") {
      if (!b.options.length) add("has a dropdown with no options", b.id);
      if (b.options.length > 25) add("has a dropdown with more than 25 options", b.id);
      b.options.forEach((o) => {
        if (!o.label.trim()) add("has a dropdown option with no label", b.id);
        checkAction(o.action, "a dropdown option", b.id);
      });
    }
    if (b.type === "box") {
      if (!b.children.length) add("has an empty box", b.id);
      b.children.forEach(check);
    }
  };
  blocks.forEach(check);
  if (!blocks.length) add("is empty");
  if (countComponents(blocks) > 40) add("has over 40 components");
  if (countChars(blocks) > 4000) add("has over 4000 text characters");
}

function findProblems() {
  const p = [];
  if (isClassic()) {
    const mp = [];
    problemsFor(cur.layout.blocks, "Main message ", mp, "main");
    p.push(...mp.filter((x) => x.msg !== "Main message is empty"));
    classicProblems(p);
  } else {
    problemsFor(cur.layout.blocks, "Main message ", p, "main");
  }
  cur.layout.replies.forEach((r) => problemsFor(r.blocks, 'Reply "' + r.name + '" ', p, r.id));
  cur.layout.forms.forEach((f) => {
    const add = (msg, id) => p.push({ msg: 'Form "' + f.name + '" ' + msg, blockId: id || null, tab: f.id, level: "error" });
    if (!f.title.trim()) add("has no title");
    if (!f.fields.length) add("has no questions");
    if (f.fields.length > 5) add("has more than 5 questions");
    const bare = f.fields.find((x) => !x.label.trim());
    if (bare) add("has a question with no label", bare.id);
    if (!f.channel_id) add("has no channel chosen for the answers");
  });
  const vnames = new Set();
  (cur.layout.variables || []).forEach((v, idx) => {
    if (!/^[A-Za-z0-9_]{1,32}$/.test(v.name || "")) {
      p.push({ msg: "Variable #" + (idx + 1) + " name must be 1-32 letters, numbers, or _", blockId: null, tab: "__vars", level: "error" });
    } else if (vnames.has(v.name)) {
      p.push({ msg: 'Duplicate variable "' + v.name + '"', blockId: null, tab: "__vars", level: "error" });
    } else {
      vnames.add(v.name);
    }
  });
  const seen = new Set();
  return p.filter((x) => {
    const k = x.tab + "|" + x.blockId + "|" + x.msg;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function problems() {
  const k = JSON.stringify(cur.layout);
  if (k !== probKey) {
    probKey = k;
    probList = findProblems();
    bad = new Set(probList.filter((x) => x.blockId).map((x) => x.blockId));
  }
  return probList;
}

function jumpToProblem(pr) {
  if (mode === "test") setMode("edit");
  tab = pr.tab;
  selId = pr.blockId;
  $("problemList").classList.add("hidden");
  renderAll();
  const el = selId ? document.querySelector('#preview [data-bid="' + selId + '"]') : null;
  if (el) {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.animate([{ boxShadow: "0 0 0 5px #e5383b" }, { boxShadow: "0 0 0 5px transparent" }], { duration: 1500 });
  }
  if (isMobile()) setPane(selId ? "settings" : "preview");
}

function drawProblemList() {
  const box = $("problemList");
  if (box.classList.contains("hidden")) return;
  const list = problems();
  box.innerHTML = list.length
    ? list.map((x, i) => '<button class="small" data-pj="' + i + '"><span class="dotred"></span><span>' + esc(x.msg) + "</span></button>").join("")
    : '<p class="muted" style="margin:6px">No problems.</p>';
}

$("problems").onclick = () => {
  if (!problems().length) return;
  const box = $("problemList");
  box.classList.toggle("hidden");
  if (box.classList.contains("hidden")) return;
  const r = $("problems").getBoundingClientRect();
  box.style.top = (r.bottom + 6) + "px";
  drawProblemList();
};

$("problemList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pj]");
  if (!b) return;
  const pr = problems()[Number(b.dataset.pj)];
  if (pr) jumpToProblem(pr);
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#problemList") && !e.target.closest("#problems")) $("problemList").classList.add("hidden");
});

/* ---------- Classic embeds ---------- */
function isClassic() { return !!(cur && cur.layout && cur.layout.kind === "classic"); }
function isClassicMain() { return isClassic() && tab === "main"; }

function blankEmbed() {
  return {
    id: uid(), title: "", description: "", color: "#5865F2", url: "",
    author_name: "", author_url: "", author_icon: "", image: "", thumbnail: "",
    footer_text: "", footer_icon: "", timestamp: false, fields: [],
  };
}

function newEmbed() {
  const e = blankEmbed();
  e.title = "New embed";
  e.description = "Write your description here";
  return e;
}

function embedSize(e) {
  return (e.title || "").length + (e.description || "").length + (e.author_name || "").length +
    (e.footer_text || "").length + e.fields.reduce((n, f) => n + (f.name || "").length + (f.value || "").length, 0);
}

function classicSize() {
  return cur.layout.embeds.reduce((n, e) => n + embedSize(e), 0);
}

function classicProblems(p) {
  const L = cur.layout;
  const add = (msg, id) => p.push({ msg: "Main message " + msg, blockId: id || null, tab: "main", level: "error" });
  const urlOk = (u) => !String(u || "").trim() || okUrl(u);
  if (L.content.length > 2000) add("has over 2000 text characters", "content");
  if (!L.content.trim() && !L.embeds.length) add("needs some text or an embed");
  if (L.embeds.length > 10) add("has more than 10 embeds");
  if (L.blocks.length > 5) add("has more than 5 rows of buttons and dropdowns");
  L.embeds.forEach((e, n) => {
    const w = "embed " + (n + 1) + " ";
    if (!(e.title || e.description || e.author_name || e.footer_text || e.fields.length || okUrl(e.image) || okUrl(e.thumbnail))) {
      add("has " + w + "with nothing in it", e.id);
    }
    if (e.title.length > 256) add("has " + w + "title over 256 characters", e.id);
    if (e.description.length > 4096) add("has " + w + "description over 4096 characters", e.id);
    if (e.author_name.length > 256) add("has " + w + "author name over 256 characters", e.id);
    if (e.footer_text.length > 2048) add("has " + w + "footer over 2048 characters", e.id);
    if (e.fields.length > 25) add("has " + w + "with more than 25 fields", e.id);
    if (e.fields.some((f) => !f.name.trim() || !f.value.trim())) add("has " + w + "with a field missing its name or value", e.id);
    if (e.fields.some((f) => f.name.length > 256 || f.value.length > 1024)) add("has " + w + "with a field that is too long", e.id);
    if (["url", "author_url", "author_icon", "image", "thumbnail", "footer_icon"].some((k) => !urlOk(e[k]))) {
      add("has " + w + "with a link not starting with https://", e.id);
    }
  });
  if (classicSize() > 6000) add("has embeds over 6000 characters in total");
}

function renderEmbed(e) {
  const s = (u) => String(u || "").trim();
  const ok = (u) => s(u).startsWith("https://");
  const c = /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : "#5865F2";
  let h = '<div class="cembed"' + bAttr(e) + ' style="border-left-color:' + c + '"><div class="ctop"><div class="cmain">';
  if (e.author_name) {
    h += '<div class="cauthor">' + (ok(e.author_icon) ? '<img src="' + esc(s(e.author_icon)) + '" alt="">' : "") +
      "<span>" + esc(e.author_name) + "</span></div>";
  }
  if (e.title) {
    h += '<div class="ctitle">' + (ok(e.url) ? '<a href="' + esc(s(e.url)) + '" target="_blank" rel="noopener">' + esc(e.title) + "</a>" : esc(e.title)) + "</div>";
  }
  if (e.description) h += '<div class="cdesc ptext">' + md(e.description) + "</div>";
  if (e.fields.length) {
    h += '<div class="cfields">' + e.fields.map((f) =>
      '<div class="cfield' + (f.inline ? " inline" : "") + '"><div class="cfname">' + esc(f.name) +
      '</div><div class="cfval">' + inline(f.value) + "</div></div>").join("") + "</div>";
  }
  h += "</div>" + (ok(e.thumbnail) ? '<img class="cthumb" src="' + esc(s(e.thumbnail)) + '" alt="">' : "") + "</div>";
  if (ok(e.image)) h += '<img class="cimg" src="' + esc(s(e.image)) + '" alt="">';
  if (e.footer_text || e.timestamp) {
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    h += '<div class="cfoot">' + (e.footer_text && ok(e.footer_icon) ? '<img src="' + esc(s(e.footer_icon)) + '" alt="">' : "") +
      "<span>" + esc(e.footer_text || "") + (e.footer_text && e.timestamp ? " &bull; " : "") + (e.timestamp ? "Today at " + esc(t) : "") + "</span></div>";
  }
  return h + "</div>";
}

function renderClassicPreview() {
  const L = cur.layout;
  const msg = L.content.trim()
    ? '<div class="ptext cmsg"' + bAttr({ id: "content" }) + ">" + md(L.content) + "</div>"
    : (mode === "test" ? "" : '<div class="dm cmsg"' + bAttr({ id: "content" }) + ">(no message text, click to add)</div>");
  return msg + L.embeds.map(renderEmbed).join("") + L.blocks.map(renderBlock).join("");
}

function classicRows() {
  const L = cur.layout;
  const row = (id, icon, name, text, buttons) =>
    '<div class="node' + (id === selId ? " sel" : "") + '" draggable="false" data-id="' + esc(id) + '">' +
    '<span class="lbl">' + ic(icon) + '<span class="tx"><b>' + name + "</b> " + esc(text) + "</span>" +
    (bad.has(id) ? '<span class="dotred"></span>' : "") + "</span>" + buttons + "</div>";
  return row("content", "text", "Message text", L.content.split("\n")[0].slice(0, 30) || "(none)", "") +
    L.embeds.map((e, n) => row(e.id, "section", "Embed " + (n + 1), (e.title || e.description || "").slice(0, 30), rowButtons())).join("") +
    treeRows(L.blocks, false);
}

function classicTreeAction(id, act) {
  const L = cur.layout;
  if (id !== "content" && !L.embeds.some((e) => e.id === id)) return false;
  if (id === "content" && act) return true;
  if (act === "up") moveEmbed(id, -1);
  else if (act === "down") moveEmbed(id, 1);
  else if (act === "dup") dupEmbed(id);
  else if (act === "del") removeEmbed(id);
  else {
    selId = id;
    renderTree();
    renderPreview();
    renderSettings();
    if (isMobile()) setPane("settings");
  }
  return true;
}

function addEmbed() {
  const L = cur.layout;
  if (L.embeds.length >= 10) { toast("A message can have at most 10 embeds."); return; }
  const e = newEmbed();
  L.embeds.push(e);
  selId = e.id;
  markDirty();
  renderAll();
  if (isMobile()) setPane("settings");
}

function moveEmbed(id, dir) {
  const a = cur.layout.embeds;
  const i = a.findIndex((x) => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= a.length) return;
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
  markDirty();
  renderAll();
}

function removeEmbed(id) {
  cur.layout.embeds = cur.layout.embeds.filter((x) => x.id !== id);
  if (selId === id) selId = null;
  markDirty();
  renderAll();
}

function dupEmbed(id) {
  const a = cur.layout.embeds;
  const i = a.findIndex((x) => x.id === id);
  if (i < 0 || a.length >= 10) return;
  const copy = JSON.parse(JSON.stringify(a[i]));
  reid(copy);
  a.splice(i + 1, 0, copy);
  selId = copy.id;
  markDirty();
  renderAll();
}

function fieldEditor(f, i) {
  return '<div class="bcard"><label style="margin-top:0">Field ' + (i + 1) + ' name</label>' +
    '<input data-f="ef_name" data-i="' + i + '" maxlength="256" value="' + esc(f.name) + '">' +
    '<label>Value</label><textarea data-f="ef_value" data-i="' + i + '" maxlength="1024">' + esc(f.value) + "</textarea>" +
    '<label>Layout</label><select data-f="ef_inline" data-i="' + i + '">' +
    opts([["0", "Full width"], ["1", "Side by side (inline)"]], f.inline ? "1" : "0") + "</select>" +
    '<button class="small danger" data-act2="efdel" data-i="' + i + '" style="margin-top:8px">' + ic("trash") + "Remove field</button></div>";
}

const DISCORD_COLORS = [
  ["#5865F2", "Blurple"], ["#57F287", "Green"], ["#FEE75C", "Yellow"],
  ["#EB459E", "Fuchsia"], ["#ED4245", "Red"], ["#1ABC9C", "Teal"],
  ["#E67E22", "Orange"], ["#2B2D31", "Dark"], ["#FFFFFF", "White"],
];

function colorPickerHtml(field, current) {
  const hex = /^#[0-9a-f]{6}$/i.test(current || "") ? current.toUpperCase() : "#5865F2";
  const swatches = DISCORD_COLORS.map(([c, name]) =>
    '<button type="button" class="cswatch' + (hex === c.toUpperCase() ? " on" : "") + '" data-act2="pickcolor" data-target="' + esc(field) + '" data-hex="' + c + '" title="' + name + ' (' + c + ')" aria-label="' + name + '" style="background:' + c + '"></button>'
  ).join("");
  return '<div style="display:flex;gap:8px;align-items:center">' +
    '<input type="color" data-f="' + esc(field) + '" value="' + esc(hex) + '" style="width:52px;height:38px;padding:2px">' +
    '<span class="muted" style="font-family:ui-monospace,monospace">' + esc(hex) + '</span></div>' +
    '<div class="cswatches">' + swatches + '</div>';
}
function classicSettings() {
  if (!isClassicMain()) return false;
  const L = cur.layout;
  const el = $("settings");
  if (selId === "content") {
    el.innerHTML = '<button class="small" data-act2="emojitext">' + ic("smile") + "Insert emoji</button>" +
      "<label>Message text (above the embeds, max 2000)</label>" + fmtBar() +
      '<textarea data-f="c_content" data-fmt-target="1" maxlength="2000">' + esc(L.content) + "</textarea>";
    return true;
  }
  const e = L.embeds.find((x) => x.id === selId);
  if (!e) return false;
  const inp = (k, lab, max) => "<label>" + lab + '</label><input data-f="e_' + k + '" maxlength="' + max + '" value="' + esc(e[k] || "") + '">';
  el.innerHTML = inp("title", "Title", 256) + inp("url", "Title link (https)", 2000) +
    '<button class="small" data-act2="emojitext" style="margin-top:8px">' + ic("smile") + "Insert emoji</button>" +
    "<label>Description (max 4096)</label>" + fmtBar() +
    '<textarea data-f="e_description" data-fmt-target="1" maxlength="4096">' + esc(e.description) + "</textarea>" +
    '<label>Colour</label>' + colorPickerHtml("e_color", e.color) +
    inp("author_name", "Author name", 256) + inp("author_url", "Author link (https)", 2000) + inp("author_icon", "Author icon (https)", 2000) +
    inp("thumbnail", "Small image, top right (https)", 2000) + inp("image", "Big image at the bottom (https)", 2000) +
    inp("footer_text", "Footer text", 2048) + inp("footer_icon", "Footer icon (https)", 2000) +
    '<label>Timestamp</label><select data-f="e_timestamp">' + opts([["0", "None"], ["1", "Time when posted"]], e.timestamp ? "1" : "0") + "</select>" +
    "<label>Fields (max 25)</label>" + e.fields.map(fieldEditor).join("") +
    (e.fields.length < 25 ? '<button class="small" data-act2="efadd">' + ic("plus") + "Add field</button>" : "");
  return true;
}

const EMBED_KEYS = ["title", "description", "color", "url", "author_name", "author_url", "author_icon", "image", "thumbnail", "footer_text", "footer_icon"];

function classicInput(e, f, v) {
  if (!/^(c_|e_|ef_)/.test(f) || !isClassicMain()) return false;
  const L = cur.layout;
  if (f === "c_content") {
    L.content = v;
  } else {
    const em = L.embeds.find((x) => x.id === selId);
    if (!em) return true;
    const i = Number(e.target.dataset.i);
    if (f === "e_timestamp") em.timestamp = v === "1";
    else if (f.startsWith("e_") && EMBED_KEYS.includes(f.slice(2))) em[f.slice(2)] = v;
    else if (em.fields[i]) {
      if (f === "ef_name") em.fields[i].name = v;
      if (f === "ef_value") em.fields[i].value = v;
      if (f === "ef_inline") em.fields[i].inline = v === "1";
    }
  }
  markDirty();
  renderTabs();
  renderTree();
  renderPreview();
  renderStatus();
  return true;
}

function classicClick(act, d) {
  if (!isClassicMain()) return false;
  if (act === "emojitext") {
    pickEmoji((em) => insertIntoField("[data-fmt-target]", "<" + (em.animated ? "a" : "") + ":" + em.name + ":" + em.id + ">"));
    return true;
  }
  const em = cur.layout.embeds.find((x) => x.id === selId);
  if (act === "efadd" && em && em.fields.length < 25) em.fields.push({ id: uid(), name: "Field", value: "Value", inline: false });
  else if (act === "efdel" && em) em.fields.splice(Number(d.i), 1);
  else return false;
  markDirty();
  renderAll();
  return true;
}

function closeNewMenu() {
  $("newMenu").classList.add("hidden");
  $("newBtn").setAttribute("aria-expanded", "false");
}

function closeMore() {
  $("moreMenu").classList.remove("open");
  $("moreBtn").setAttribute("aria-expanded", "false");
}

$("moreBtn").onclick = (e) => {
  e.stopPropagation();
  const open = $("moreMenu").classList.toggle("open");
  $("moreBtn").setAttribute("aria-expanded", open ? "true" : "false");
};
document.addEventListener("click", (e) => {
  if (e.target.closest("#moreMenu button") || !e.target.closest("#moreMenu, #moreBtn")) closeMore();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMore(); });

$("newBtn").onclick = (e) => {
  e.stopPropagation();
  const open = $("newMenu").classList.toggle("hidden") === false;
  $("newBtn").setAttribute("aria-expanded", open ? "true" : "false");
};
document.addEventListener("click", (e) => { if (!e.target.closest(".newwrap")) closeNewMenu(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNewMenu(); });

$("newClassicBtn").onclick = () => {
  closeNewMenu();
  openBuilder({ id: null, name: "Untitled embed", layout: { kind: "classic", content: "", embeds: [newEmbed()], blocks: [], replies: [], forms: [] } });
};

function label(b) {
  if (b.type === "text" || b.type === "section") return b.content.split("\n")[0].slice(0, 30) || "(empty)";
  if (b.type === "images") return b.urls.filter((x) => x.trim()).length + " image(s)";
  if (b.type === "box") return b.children.length + " part(s)";
  if (b.type === "button_row") return b.buttons.map((x) => x.label || ":" + (x.emoji ? x.emoji.name : "") + ":").join(", ").slice(0, 30);
  if (b.type === "dropdown") return b.options.length + " option(s)";
  return b.spacing + (b.line ? " line" : "");
}

/* ---------- Rendering ---------- */
function renderBtn(x) {
  const link = x.action.type === "link";
  return '<span class="pbtn ' + (link ? "" : esc(x.style || "grey")) + '" data-btn="' + esc(x.id) + '">' +
    (x.emoji ? '<img class="emoji" src="' + emojiUrl(x.emoji) + '" alt="">' : "") +
    esc(x.label) + (link ? " &#8599;" : "") + "</span>";
}

function bAttr(b) {
  if (mode === "test") return "";
  return ' data-bid="' + esc(b.id) + '"' + (b.id === selId ? ' data-sel="1"' : "") + (bad.has(b.id) ? ' data-problem="1"' : "");
}

function renderBlock(b) {
  const a = bAttr(b);
  if (b.type === "text") return '<div class="ptext"' + a + ">" + md(b.content) + "</div>";
  if (b.type === "section") {
    let side;
    if (b.side === "thumbnail") {
      side = b.image.trim().startsWith("https://")
        ? '<img class="pthumb" src="' + esc(b.image.trim()) + '" alt="">'
        : '<div class="pthumb ph"></div>';
    } else {
      side = renderBtn(b.button);
    }
    return '<div class="psec"' + a + '><div class="psec-text ptext">' + md(b.content) + '</div><div class="psec-side">' + side + "</div></div>";
  }
  if (b.type === "images") {
    const u = b.urls.filter((x) => x.trim().startsWith("https://"));
    if (!u.length) return '<div class="dm"' + a + '>[image]</div>';
    const cols = u.length === 1 ? 1 : 2;
    return '<div class="pimgs"' + a + ' style="grid-template-columns:repeat(' + cols + ',1fr)">' +
      u.map((x) => '<img src="' + esc(x.trim()) + '" alt="">').join("") + "</div>";
  }
  if (b.type === "divider") {
    return '<div class="pdiv ' + (b.line ? "line " : "") + (b.spacing === "large" ? "large" : "") + '"' + a + "></div>";
  }
  if (b.type === "button_row") {
    return '<div class="pbtns"' + a + ">" + b.buttons.map(renderBtn).join("") + "</div>";
  }
  if (b.type === "dropdown") {
    return '<div class="psel"' + a + ' data-dd="' + esc(b.id) + '"><span>' + esc(b.placeholder || "Choose an option...") + "</span><span>&#9662;</span></div>";
  }
  if (b.type === "box") {
    const c = /^#[0-9a-f]{6}$/i.test(b.accent) ? b.accent : "#5865F2";
    const inner = b.children.map(renderBlock).join("") +
      (mode === "test" ? "" : '<div class="padd" data-addto="' + esc(b.id) + '">+ Add inside the box</div>');
    return '<div class="pbox"' + a + ' style="border-left-color:' + c + '">' + inner + "</div>";
  }
  return "";
}

function renderFormPreview(f) {
  return '<div class="pform"><h2>' + esc(f.title || "Form") + "</h2>" +
    f.fields.map((x) =>
      '<div class="q">' + esc(x.label) + (x.required ? ' <span style="color:#f23f43">*</span>' : "") + "</div>" +
      '<div class="fake' + (x.style === "paragraph" ? " tall" : "") + '">' + esc(x.placeholder || "") + "</div>"
    ).join("") + '<div class="foot"><span class="pbtn blue">Submit</span></div></div>';
}

function rowButtons() {
  return '<button class="small ib" data-act="up" title="Move up" aria-label="Move up">' + ic("up") + "</button>" +
    '<button class="small ib" data-act="down" title="Move down" aria-label="Move down">' + ic("down") + "</button>" +
    '<button class="small ib" data-act="dup" title="Duplicate" aria-label="Duplicate">' + ic("copy") + "</button>" +
    '<button class="small ib danger" data-act="del" title="Delete" aria-label="Delete">' + ic("trash") + "</button>";
}

function treeRows(list, child) {
  return list.map((b) => {
    let html = '<div class="node' + (child ? " child" : "") + (b.id === selId ? " sel" : "") +
      '" draggable="true" data-id="' + esc(b.id) + '">' +
      '<span class="lbl">' + ic(TYPE_ICON[b.type]) + '<span class="tx"><b>' + NAMES[b.type] + "</b> " + esc(label(b)) + "</span>" +
      (bad.has(b.id) ? '<span class="dotred"></span>' : "") + "</span>" +
      rowButtons() + "</div>";
    if (b.type === "box") html += treeRows(b.children, true);
    return html;
  }).join("");
}

function fieldRows(f) {
  return f.fields.map((x) =>
    '<div class="node' + (x.id === selId ? " sel" : "") + '" draggable="true" data-id="' + esc(x.id) + '">' +
    '<span class="lbl">' + ic("question") + '<span class="tx"><b>Question</b> ' + esc(x.label) + "</span>" +
    (bad.has(x.id) ? '<span class="dotred"></span>' : "") + "</span>" + rowButtons() + "</div>"
  ).join("");
}

function renderTabs() {
  const all = [{ id: "main", name: "Main message" }]
    .concat(cur.layout.replies.map((r) => ({ id: r.id, name: r.name })))
    .concat(cur.layout.forms.map((f) => ({ id: f.id, name: "Form: " + f.name }))).concat((cur.layout.pages || []).map((p) => ({ id: p.id, name: p.name })));
  const list = problems();
  $("tabs").innerHTML = all.map((t) =>
    '<button class="small' + (t.id === tab ? " primary" : "") + '" data-tab="' + esc(t.id) + '">' + esc(t.name) +
    (list.some((x) => x.tab === t.id) ? '<span class="dotred"></span>' : "") + "</button>"
  ).join("") +
    '<button class="small" data-tab="__new">' + ic("reply") + "Reply</button>" +
    '<button class="small' + (tab === "__vars" ? " primary" : "") + '" data-tab="__vars">' + ic("code") + "Variables" + ((cur.layout.variables || []).length ? " (" + cur.layout.variables.length + ")" : "") + (list.some((x) => x.tab === "__vars") ? '<span class="dotred"></span>' : "") + "</button>" + '<button class="small" data-tab="__newform">' + ic("form") + "Form</button>" + '<button class="small" data-tab="__newpage">' + ic("plus") + "Page</button>";
}

function extractUsedVars() {
  const found = [];
  const seen = new Set();
  const urlKeys = new Set(["url", "author_url", "author_icon", "image", "thumbnail", "footer_icon", "urls"]);
  const scan = (obj) => {
    if (typeof obj === "string") {
      const re = /\{\{([A-Za-z0-9_]{1,32})\}\}/g;
      let m;
      while ((m = re.exec(obj)) !== null) {
        if (!seen.has(m[1])) { seen.add(m[1]); found.push(m[1]); }
      }
    } else if (Array.isArray(obj)) obj.forEach(scan);
    else if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((k) => { if (!urlKeys.has(k)) scan(obj[k]); });
    }
  };
  scan(cur.layout);
  return found;
}

function renderTree() {
  problems();
  if (tab === "__vars") {
    $("treeTitle").textContent = "Variables (max 20)";
    $("blockPalette").classList.add("hidden");
    $("fieldPalette").classList.add("hidden");
    const vars = cur.layout.variables || [];
    $("tree").innerHTML = vars.length
      ? vars.map((v) =>
        '<div class="node" draggable="false"><span class="lbl">' + ic("code") +
        '<span class="tx"><b>{{' + esc(v.name || "?") + '}}</b> ' + esc(v.default || "") + "</span></span></div>"
      ).join("")
      : '<p class="muted">No variables yet. Add one in Settings.</p>';
    return;
  }
  const f = activeForm();
  $("treeTitle").textContent = f ? "Questions (max 5)" : "Message tree";
  $("blockPalette").classList.toggle("hidden", !!f);
  $("fieldPalette").classList.toggle("hidden", !f);
  document.querySelectorAll("[data-add]").forEach((b) => {
    const keep = isClassicMain() ? ["embed", "button_row", "dropdown"].includes(b.dataset.add) : b.dataset.add !== "embed";
    b.classList.toggle("hidden", !keep);
  });
  $("tree").innerHTML = f ? fieldRows(f) : isClassicMain() ? classicRows() : treeRows(activeBlocks(), false);
}

function renderVarPlayground() {
  const el = $("varPlayground");
  if (!el || !cur) return;
  const vars = cur.layout.variables || [];
  if (!vars.length) { el.classList.add("hidden"); el.innerHTML = ""; return; }
  el.classList.remove("hidden");
  el.innerHTML = '<div class="varplay-head"><b>Variables Playground</b><div class="btnrow">' +
    (cur.id ? '<button type="button" class="small" id="vpServerBtn">Test via Server</button>' : '') +
    '<button type="button" class="small" id="vpResetBtn">Reset</button>' +
    '<button type="button" class="small" id="vpToggleBtn">' + (varPlayOpen ? "Hide" : "Show") + '</button></div></div>' +
    (varPlayOpen ? '<div class="varplay-grid">' + vars.map((v) => {
      const val = varTestValues[v.name] !== undefined ? varTestValues[v.name] : (v.default || "");
      return '<label>{{' + esc(v.name) + '}}<input data-vp="' + esc(v.name) + '" value="' + esc(val) + '" placeholder="' + esc(v.default || "value...") + '"></label>';
    }).join("") + '</div>' : '');
}

function renderPreview() {
  renderVarPlayground();
  problems();
  hideAddMenu();
  const f = activeForm();
  if (f) {
    const c = chans.find((x) => x.id === f.channel_id);
    $("previewNote").textContent = "Pop-up form. Answers go to " + (c ? "#" + c.name : "(choose a channel in settings)") + "." +
      (mode === "test" ? " To test it, click the form's button in the main message." : "");
    $("preview").innerHTML = renderFormPreview(f);
    hideFloatBar();
    return;
  }
  const base = activeReply() ? "Private reply: only the person who clicks sees this." : "";
  $("previewNote").textContent = mode === "test"
    ? "Test mode: click buttons and dropdowns. Nothing is sent. Role permissions are checked by Discord for real."
    : base;
  $("preview").innerHTML = (isClassicMain() ? renderClassicPreview() : activeBlocks().map(renderBlock).join("")) +
    (mode === "test" ? "" : '<div class="padd" data-addto="main">+ Add</div>');
  if (mode === "test") hideFloatBar(); else positionFloatBar();
}

function updateCharCount() {
  const el = $("charCount");
  if (!el || !cur || activeForm()) return;
  const n = countChars(activeBlocks());
  el.textContent = n + " / 4000 characters in this message";
  el.style.color = n > 4000 ? "var(--bad)" : "";
}

function renderStatus() {
  updateCharCount();
  const f = activeForm();
  const ce = $("counter");
  if (f) {
    ce.textContent = f.fields.length + "/5 questions";
    ce.className = "badge " + (f.fields.length > 5 ? "bad" : "ok");
  } else {
    const n = isClassicMain() ? 0 : countComponents(activeBlocks());
    ce.textContent = isClassicMain() ? classicSize() + "/6000 embed characters" : n + "/40 components";
    ce.className = "badge " + ((isClassicMain() ? classicSize() > 6000 : n > 40) ? "bad" : "ok");
  }
  const chg = $("changed");
  chg.classList.toggle("hidden", !(cur.posted_message_id && cur.changed));
  const probs = problems();
  const pe = $("problems");
  pe.textContent = probs.length ? probs[0].msg + (probs.length > 1 ? " (+" + (probs.length - 1) + ")" : "") : "Ready to post";
  pe.className = "badge " + (probs.length ? "bad" : "ok");
  if (!probs.length) $("problemList").classList.add("hidden");
  drawProblemList();
  const sb = $("saveBtn");
  sb.className = dirty ? "primary" : "clean";
  sb.innerHTML = ic(dirty ? "save" : "check") + "<span>" + (dirty ? "Save" : "Saved") + "</span>" +
    (dirty ? '<span class="dot"></span>' : "");
}

function roleList() {
  return [["", "Choose..."]].concat(roles.map((r) =>
    [r.id, r.name + (r.assignable ? "" : " (bot can't manage)") + (r.dangerous ? " (powerful role)" : "")]));
}

function roleWarn(id) {
  const r = roles.find((x) => x.id === id);
  return r && r.dangerous
    ? '<p class="muted" style="color:var(--bad)">This role has powerful permissions. The bot refuses to give roles that have Administrator, Manage Server or Manage Roles.</p>'
    : "";
}

function actionExtra(a, p, i) {
  if (a.type === "link") {
    return '<label>Link (https)</label><input data-f="burl" data-i="' + i + '" value="' + esc(a.url) + '">';
  }
  if (a.type === "reply") {
    if (!cur.layout.replies.length) return '<p class="muted">Make a reply first with the "Reply" tab above the tree.</p>';
    const list = [["", "Choose..."]].concat(cur.layout.replies.map((r) => [r.id, r.name]));
    return '<label>Reply to show</label><select data-f="' + p + 'reply" data-i="' + i + '">' + opts(list, a.reply_id) + "</select>";
  }
  if (a.type === "form") {
    if (!cur.layout.forms.length) return '<p class="muted">Make a form first with the "Form" tab above the tree.</p>';
    const list = [["", "Choose..."]].concat(cur.layout.forms.map((f) => [f.id, f.name]));
    return '<label>Form to open</label><select data-f="' + p + 'form" data-i="' + i + '">' + opts(list, a.form_id) + "</select>";
  }
  if (a.type === "role") {
    return '<label>What it does</label><select data-f="' + p + 'mode" data-i="' + i + '">' +
      opts([["toggle", "Toggle (add or remove)"], ["add", "Add the role"], ["remove", "Remove the role"]], a.mode) + "</select>" +
      '<label>Role</label><select data-f="' + p + 'role" data-i="' + i + '">' + opts(roleList(), a.role_id) + "</select>" + roleWarn(a.role_id);
  }
  if (a.type === "page") {
    const pages = cur.layout.pages || [];
    if (!pages.length) return '<p class="muted">Add a page first with the "+ Page" tab above the tree.</p>';
    const list = [["-2", "Next page"], ["-1", "Previous page"], ["0", "1. Main message"]].concat(pages.map((pg, idx) => [String(idx + 1), (idx + 2) + ". " + (pg.name || "Page")]));
    return '<label>Page to show</label><select data-f="' + p + 'page" data-i="' + i + '">' + opts(list, String(a.page_index ?? -2)) + "</select>";
  }
  return "";
}

function roleChecks(allowed, p, i) {
  if (!roles.length) return '<p class="muted">No roles loaded for this server.</p>';
  return '<div style="max-height:160px;overflow:auto">' + roles.map((r) =>
    '<label style="text-transform:none;display:flex;gap:8px;align-items:center;letter-spacing:0;margin:4px 0">' +
    '<input type="checkbox" data-f="' + p + 'rolechk" data-i="' + i + '" data-rid="' + esc(r.id) + '"' +
    (allowed.includes(r.id) ? " checked" : "") + "> " + esc(r.name) + "</label>"
  ).join("") + "</div>";
}

function rulesEditor(x, p, i) {
  const allowed = x.allowed_roles || [];
  const n = allowed.length + (x.cooldown > 0 ? 1 : 0) + (x.once ? 1 : 0);
  return '<details style="margin-top:8px"' + (n ? " open" : "") + '><summary class="muted" style="cursor:pointer">Who can use it' +
    (n ? " (" + n + " rule" + (n > 1 ? "s" : "") + " on)" : " (everyone)") + "</summary>" +
    "<label>Only people with one of these roles (none ticked = everyone)</label>" + roleChecks(allowed, p, i) +
    "<label>Cooldown for each person, in seconds (0 = none)</label>" +
    '<input type="number" min="0" max="86400" data-f="' + p + 'cd" data-i="' + i + '" value="' + (x.cooldown || 0) + '">' +
    '<label style="text-transform:none;display:flex;gap:8px;align-items:center;letter-spacing:0">' +
    '<input type="checkbox" data-f="' + p + 'once" data-i="' + i + '"' + (x.once ? " checked" : "") + "> Each person can use it only once</label></details>";
}

function buttonEditor(x, i, single) {
  const colour = x.action.type === "link" ? "" :
    '<label>Colour</label><select data-f="bstyle" data-i="' + i + '">' +
    opts([["grey", "Grey"], ["blue", "Blue"], ["green", "Green"], ["red", "Red"]], x.style) + "</select>";
  return '<div class="bcard"><label style="margin-top:0">' + (single ? "Button" : "Button " + (i + 1)) + " label</label>" +
    '<input data-f="blabel" data-i="' + i + '" value="' + esc(x.label) + '">' +
    emojiRow(x, "b", i) +
    '<label>When clicked</label><select data-f="baction" data-i="' + i + '">' +
    opts([["link", "Open a link"], ["reply", "Show a private reply"], ["form", "Open a pop-up form"], ["role", "Give or remove a role"], ["page", "Go to page"]], x.action.type) + "</select>" +
    actionExtra(x.action, "b", i) + colour +
    (x.action.type === "link" ? "" : rulesEditor(x, "b", i)) +
    (single ? "" : '<button class="small danger" data-act2="delbtn" data-i="' + i + '" style="margin-top:8px">' + ic("trash") + "Remove button</button>") +
    "</div>";
}

function optionEditor(o, i) {
  return '<div class="bcard"><label style="margin-top:0">Option ' + (i + 1) + " label</label>" +
    '<input data-f="olabel" data-i="' + i + '" value="' + esc(o.label) + '">' +
    emojiRow(o, "o", i) +
    "<label>Small description (optional)</label>" +
    '<input data-f="odesc" data-i="' + i + '" value="' + esc(o.description || "") + '">' +
    '<label>When chosen</label><select data-f="oaction" data-i="' + i + '">' +
    opts([["reply", "Show a private reply"], ["form", "Open a pop-up form"], ["role", "Give or remove a role"], ["page", "Go to page"]], o.action.type) + "</select>" +
    actionExtra(o.action, "o", i) +
    rulesEditor(o, "o", i) +
    '<button class="small danger" data-act2="delopt" data-i="' + i + '" style="margin-top:8px">' + ic("trash") + "Remove option</button></div>";
}

function renderFormSettings(f) {
  const el = $("settings");
  const q = f.fields.find((x) => x.id === selId);
  if (q) {
    el.innerHTML = '<label>Question label (max 45 characters)</label><input maxlength="45" data-f="qlabel" value="' + esc(q.label) + '">' +
      '<label>Answer size</label><select data-f="qstyle">' + opts([["short", "Short (one line)"], ["paragraph", "Paragraph"]], q.style) + "</select>" +
      '<label>Hint text (optional)</label><input maxlength="100" data-f="qph" value="' + esc(q.placeholder || "") + '">' +
      '<label>Required</label><select data-f="qreq">' + opts([["1", "Yes"], ["0", "No"]], q.required ? "1" : "0") + "</select>";
    return;
  }
  const list = [["", "Choose..."]].concat(chans.map((c) => [c.id, "#" + c.name]));
  el.innerHTML = '<label>Form name (for you)</label><input data-f="fname" value="' + esc(f.name) + '">' +
    '<label>Pop-up title (max 45 characters)</label><input maxlength="45" data-f="ftitle" value="' + esc(f.title) + '">' +
    '<label>Send answers to channel</label><select data-f="fchan">' + opts(list, f.channel_id) + "</select>" +
    '<label>Thank-you message (shown privately)</label><textarea data-f="fthanks">' + esc(f.thanks || "") + "</textarea>" +
    '<p class="muted">Select a question in the tree to edit it.</p>' +
    '<button class="small danger" data-act2="delform">' + ic("trash") + "Delete this form</button>";
}

function crumbs() {
  const f = activeForm();
  const r = activeReply();
  const parts = [{ name: f ? "Form: " + f.name : r ? r.name : "Main message", id: "root" }];
  if (f) {
    if (f.fields.some((x) => x.id === selId)) parts.push({ name: "Question" });
  } else {
    const loc = selId ? findLoc(selId) : null;
    if (loc) {
      if (loc.parent) parts.push({ name: NAMES.box, id: loc.parent.id });
      parts.push({ name: NAMES[loc.list[loc.index].type] });
    }
  }
  return '<div class="crumbs">' + parts.map((p, i) =>
    i === parts.length - 1
      ? "<b>" + esc(p.name) + "</b>"
      : '<span data-crumb="' + esc(p.id) + '">' + esc(p.name) + "</span>"
  ).join('<span>&rsaquo;</span>') + "</div>";
}

function renderSettings() {
  renderSettingsBody();
  $("settings").insertAdjacentHTML("afterbegin", crumbs());
  updateCharCount();
  growAllTextareas();
}

$("settings").addEventListener("click", (e) => {
  const c = e.target.closest("[data-crumb]");
  if (!c) return;
  selId = c.dataset.crumb === "root" ? null : c.dataset.crumb;
  renderAll();
});

function renderSettingsBody() {
  const el = $("settings");
  if (tab === "__vars") {
    const vars = cur.layout.variables || [];
    const used = extractUsedVars();
    const defined = new Set(vars.map((v) => v.name));
    const missing = used.filter((n) => !defined.has(n));
    el.innerHTML = '<p class="muted">Use <code>{{name}}</code> in any text, title, description, or button label. URLs are never substituted.</p>' +
      (missing.length ? '<div class="bcard"><b>Detected in message:</b><div class="btnrow" style="margin-top:6px">' +
        missing.map((n) => '<button type="button" class="small" data-act2="addvarnamed" data-vname="' + esc(n) + '">' + ic("plus") + '{{' + esc(n) + '}}</button>').join("") +
        '</div></div>' : '') +
      vars.map((v, i) =>
        '<div class="bcard"><label style="margin-top:0">Variable name (letters, numbers, _)</label>' +
        '<input data-f="vname" data-i="' + i + '" maxlength="32" value="' + esc(v.name) + '">' +
        '<label>Default value</label>' +
        '<input data-f="vdefault" data-i="' + i + '" maxlength="2000" value="' + esc(v.default || "") + '">' +
        '<button type="button" class="small danger" data-act2="delvar" data-i="' + i + '" style="margin-top:8px">' + ic("trash") + 'Remove</button></div>'
      ).join("") +
      (vars.length < 20 ? '<button type="button" class="small" data-act2="addvar">' + ic("plus") + 'Add variable</button>' : '<p class="muted">Max 20 variables reached.</p>') + '<h3 style="margin-top:16px">Permanent Discord variables</h3><p class="muted">Click any variable to copy it. These fill in automatically when posted or when a user clicks a reply button.</p>' + BUILTIN_VARS.map(([grp, items]) => '<div class="bcard"><b>' + esc(grp) + '</b><div style="margin-top:6px;display:flex;flex-direction:column;gap:4px">' + items.map(([k, desc]) => '<button type="button" class="small" data-act2="copyvar" data-vname="' + esc(k) + '" style="justify-content:space-between"><span><b>{{' + esc(k) + '}}</b></span><span class="muted">' + esc(desc) + '</span></button>').join("") + '</div></div>').join("");
    return;
  }
  const form = activeForm();
  if (form) { renderFormSettings(form); return; }
  if (classicSettings()) return;
  const loc = selId ? findLoc(selId) : null;
  if (!loc) {
    const r = activeReply();
    const pg = activePage();
    if (r) {
      el.innerHTML = '<label>Reply name</label><input data-f="rname" value="' + esc(r.name) + '">' +
        '<p class="muted">Only the person who clicks the button sees this reply.</p>' +
        '<button class="small danger" data-act2="delreply">' + ic("trash") + "Delete this reply</button>";
    } else if (pg) {
      el.innerHTML = '<label>Page name</label><input data-f="pname" value="' + esc(pg.name) + '">' +
        '<p class="muted">Use a button or dropdown with "Go to page" to switch pages in Discord.</p>' +
        '<button class="small danger" data-act2="delpage">' + ic("trash") + "Delete this page</button>";
    } else {
      el.innerHTML = '<p class="muted">Select a part in the tree to edit it.</p>';
    }
    return;
  }
  const b = loc.list[loc.index];
  let h = "";
  if (b.type === "text") {
    h = '<button class="small" data-act2="emojitext">' + ic("smile") + "Insert emoji</button>" +
      "<label>Text (supports Discord markdown and custom emoji)</label>" + fmtBar() +
      '<textarea data-f="content">' + esc(b.content) + '</textarea><div id="charCount" class="muted" style="margin-top:4px"></div>';
  }
  if (b.type === "section") {
    h = '<button class="small" data-act2="emojitext">' + ic("smile") + "Insert emoji</button>" +
      "<label>Text (left side)</label>" + fmtBar() +
      '<textarea data-f="content">' + esc(b.content) + '</textarea><div id="charCount" class="muted" style="margin-top:4px"></div>' +
      '<label>Right side</label><select data-f="side">' + opts([["button", "Button"], ["thumbnail", "Small image"]], b.side) + "</select>" +
      (b.side === "thumbnail"
        ? '<label>Image link (https)</label><input data-f="image" value="' + esc(b.image) + '">'
        : buttonEditor(b.button, 0, true));
  }
  if (b.type === "images") {
    h = '<label>Image links (https, one per line, max 10)</label><textarea data-f="urls">' + esc(b.urls.join("\n")) + "</textarea>";
  }
  if (b.type === "divider") {
    h = '<label>Spacing</label><select data-f="spacing">' + opts([["small", "Small"], ["large", "Large"]], b.spacing) + "</select>" +
      '<label>Line</label><select data-f="line">' + opts([["1", "Show line"], ["0", "No line"]], b.line ? "1" : "0") + "</select>";
  }
  if (b.type === "box") {
    h = '<label>Accent colour</label>' + colorPickerHtml("accent", b.accent);
  }
  if (b.type === "button_row") {
    h = b.buttons.map((x, i) => buttonEditor(x, i, false)).join("") +
      '<button class="small" data-act2="addbtn">' + ic("plus") + "Add button</button>";
  }
  if (b.type === "dropdown") {
    h = '<label>Placeholder text</label><input data-f="dph" value="' + esc(b.placeholder || "") + '">' +
      b.options.map(optionEditor).join("") +
      '<button class="small" data-act2="addopt">' + ic("plus") + "Add option</button>";
  }
  el.innerHTML = h;
}

function renderAll() {
  if (tab !== "main" && tab !== "__vars" && !activeReply() && !activeForm() && !activePage()) tab = "main";
  renderTabs();
  renderTree();
  renderPreview();
  renderSettings();
  renderStatus();
}

/* ---------- Events ---------- */
$("tabs").addEventListener("click", (e) => {
  const t = btnData(e).tab;
  if (!t) return;
  if (t === "__new") { addReply(); return; }
  if (t === "__newform") { addForm(); return; }
  if (t === "__newpage") { addPage(); return; }
  tab = t;
  selId = null;
  testClear();
  renderAll();
});

$("tree").addEventListener("click", (e) => {
  const node = e.target.closest(".node");
  if (!node) return;
  const id = node.dataset.id;
  const act = btnData(e).act;
  if (isClassicMain() && classicTreeAction(id, act)) return;
  if (activeForm()) {
    if (act === "up") moveField(id, -1);
    else if (act === "down") moveField(id, 1);
    else if (act === "dup") dupField(id);
    else if (act === "del") removeField(id);
    else {
      selId = id;
      renderTree();
      renderSettings();
      if (isMobile()) setPane("settings");
    }
    return;
  }
  if (act === "up") moveBlock(id, -1);
  else if (act === "down") moveBlock(id, 1);
  else if (act === "dup") dupBlock(id);
  else if (act === "del") removeBlock(id);
  else {
    selId = id;
    renderTree();
    renderPreview();
    renderSettings();
    if (isMobile()) setPane("settings");
  }
});

/* ---------- Drag and drop in the tree ---------- */
function clearDropMarks() {
  document.querySelectorAll(".node.drop-before,.node.drop-after,.node.drop-into").forEach((n) => {
    n.classList.remove("drop-before", "drop-after", "drop-into");
  });
}

function dropZone(e, node) {
  let movingIsBox = false;
  let targetIsBox = false;
  if (!activeForm()) {
    const m = findLoc(dragId);
    const t = findLoc(node.dataset.id);
    movingIsBox = !!m && m.list[m.index].type === "box";
    targetIsBox = !!t && t.list[t.index].type === "box";
  }
  const r = node.getBoundingClientRect();
  const y = (e.clientY - r.top) / r.height;
  if (targetIsBox && !movingIsBox) return y < 0.25 ? "before" : y > 0.75 ? "after" : "into";
  return y < 0.5 ? "before" : "after";
}

$("tree").addEventListener("dragstart", (e) => {
  const node = e.target.closest(".node");
  if (!node) return;
  dragId = node.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  try { e.dataTransfer.setData("text/plain", dragId); } catch (err) {}
});

$("tree").addEventListener("dragover", (e) => {
  const node = e.target.closest(".node");
  if (!node || !dragId) return;
  e.preventDefault();
  clearDropMarks();
  if (node.dataset.id === dragId) return;
  node.classList.add("drop-" + dropZone(e, node));
});

$("tree").addEventListener("drop", (e) => {
  const node = e.target.closest(".node");
  if (!node || !dragId) return;
  e.preventDefault();
  const where = dropZone(e, node);
  const src = dragId;
  dragId = null;
  clearDropMarks();
  if (activeForm()) dropField(src, node.dataset.id, where === "into" ? "after" : where);
  else dropBlock(src, node.dataset.id, where);
});

$("tree").addEventListener("dragend", () => { dragId = null; clearDropMarks(); });

/* ---------- Preview: select, hover, toolbar, "+ Add" ---------- */
const ADD_TYPES = ["text", "section", "images", "divider", "box", "button_row", "dropdown"];
let hoverEl = null;

function hideFloatBar() { $("floatBar").classList.add("hidden"); }
function hideAddMenu() { $("addMenu").classList.add("hidden"); }

function positionFloatBar() {
  const bar = $("floatBar");
  const el = selId && !activeForm() && mode !== "test" ? $("preview").querySelector('[data-bid="' + selId + '"]') : null;
  const loc = el ? findLoc(selId) : null;
  if (!el || !loc) { hideFloatBar(); return; }
  bar.querySelector('[data-fact="up"]').disabled = loc.index === 0;
  bar.querySelector('[data-fact="down"]').disabled = loc.index === loc.list.length - 1;
  bar.querySelector('[data-fact="parent"]').classList.toggle("hidden", !loc.parent);
  bar.classList.remove("hidden");
  const b = $("discordBox").getBoundingClientRect();
  const r = el.getBoundingClientRect();
  let top = r.top - b.top - bar.offsetHeight - 6;
  if (top < 4) top = r.bottom - b.top + 6;
  let left = r.right - b.left - bar.offsetWidth;
  left = Math.max(4, Math.min(left, b.width - bar.offsetWidth - 4));
  bar.style.top = top + "px";
  bar.style.left = left + "px";
}

function openAddMenu(row, target) {
  const menu = $("addMenu");
  const types = isClassicMain() ? ["embed", "button_row", "dropdown"] : target === "main" ? ADD_TYPES : ADD_TYPES.filter((t) => t !== "box");
  menu.innerHTML = types.map((t) =>
    '<button class="small" data-addtype="' + t + '" data-target="' + esc(target) + '">' + ic(TYPE_ICON[t]) + NAMES[t] + "</button>"
  ).join("");
  menu.classList.remove("hidden");
  const b = $("discordBox").getBoundingClientRect();
  const r = row.getBoundingClientRect();
  menu.style.top = (r.bottom - b.top + 4) + "px";
  menu.style.left = Math.max(4, Math.min(r.left - b.left, b.width - menu.offsetWidth - 4)) + "px";
}

function addBlockTo(type, target) {
  if (type === "embed") { addEmbed(); return; }
  const b = newBlock(type);
  if (target === "main") {
    activeBlocks().push(b);
  } else {
    const loc = findLoc(target);
    if (!loc) return;
    const box = loc.list[loc.index];
    if (box.type !== "box" || type === "box") return;
    box.children.push(b);
  }
  selId = b.id;
  markDirty();
  renderAll();
  if (isMobile()) setPane("settings");
}

$("preview").addEventListener("mouseover", (e) => {
  const el = e.target.closest("[data-bid]");
  if (el === hoverEl) return;
  if (hoverEl) hoverEl.removeAttribute("data-hover");
  hoverEl = el;
  if (el) el.setAttribute("data-hover", "1");
});

$("preview").addEventListener("mouseleave", () => {
  if (hoverEl) hoverEl.removeAttribute("data-hover");
  hoverEl = null;
});

$("preview").addEventListener("click", (e) => {
  if (activeForm()) return;
  if (mode === "test") { testClick(e); return; }
  e.preventDefault();
  const add = e.target.closest("[data-addto]");
  if (add) { openAddMenu(add, add.dataset.addto); return; }
  hideAddMenu();
  const el = e.target.closest("[data-bid]");
  const next = el ? el.dataset.bid : null;
  if (next !== selId) {
    selId = next;
    renderTree();
    renderPreview();
    renderSettings();
    const row = selId ? document.querySelector('#tree [data-id="' + selId + '"]') : null;
    if (row) row.scrollIntoView({ block: "nearest" });
  }
  if (selId && isMobile()) setPane("settings");
});

$("addMenu").addEventListener("click", (e) => {
  const d = btnData(e);
  if (!d.addtype) return;
  hideAddMenu();
  addBlockTo(d.addtype, d.target);
});

$("floatBar").addEventListener("click", (e) => {
  const act = btnData(e).fact;
  if (!act || !selId) return;
  if (act === "up") moveBlock(selId, -1);
  else if (act === "down") moveBlock(selId, 1);
  else if (act === "dup") dupBlock(selId);
  else if (act === "del") removeBlock(selId);
  else if (act === "parent") {
    const loc = findLoc(selId);
    if (loc && loc.parent) { selId = loc.parent.id; renderAll(); }
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#addMenu") && !e.target.closest("[data-addto]")) hideAddMenu();
});
$("preview").addEventListener("load", positionFloatBar, true);
window.addEventListener("resize", () => { positionFloatBar(); hideAddMenu(); });

$("addFieldBtn").onclick = addField;

function buttonsOf(b) {
  return b.type === "section" ? [b.button] : b.buttons;
}

$("settings").addEventListener("input", (e) => {
  if (e.target.tagName === "TEXTAREA") autoGrow(e.target);
  const f = e.target.dataset.f;
  const v = e.target.value;
  if (f && classicInput(e, f, v)) return;
  if (!f) return;

  if (f === "vname" || f === "vdefault") {
    const idx = Number(e.target.dataset.i);
    const vobj = (cur.layout.variables || [])[idx];
    if (vobj) {
      if (f === "vname") vobj.name = v.replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
      if (f === "vdefault") vobj.default = v;
      markDirty();
      renderTabs();
      renderTree();
      renderPreview();
      renderStatus();
    }
    return;
  }
  if (f === "rname") {
    const r = activeReply();
    if (r) r.name = v;
    markDirty();
    renderTabs();
    renderStatus();
    return;
  }
  if (f === "pname") {
    const pg = activePage();
    if (pg) pg.name = v;
    markDirty();
    renderTabs();
    renderStatus();
    return;
  }

  const form = activeForm();
  if (form) {
    if (f === "fname") form.name = v;
    if (f === "ftitle") form.title = v;
    if (f === "fchan") form.channel_id = v;
    if (f === "fthanks") form.thanks = v;
    const q = form.fields.find((x) => x.id === selId);
    if (q) {
      if (f === "qlabel") q.label = v;
      if (f === "qstyle") q.style = v;
      if (f === "qph") q.placeholder = v;
      if (f === "qreq") q.required = v === "1";
    }
    markDirty();
    if (f === "fname") renderTabs();
    renderTree();
    renderPreview();
    renderStatus();
    return;
  }

  const loc = findLoc(selId);
  if (!loc) return;
  const b = loc.list[loc.index];
  const i = Number(e.target.dataset.i);
  const btns = b.type === "dropdown" ? [] : buttonsOf(b);
  let again = false;
  if (f === "content") b.content = v;
  if (f === "urls") b.urls = v.split("\n");
  if (f === "spacing") b.spacing = v;
  if (f === "line") b.line = v === "1";
  if (f === "accent") b.accent = v;
  if (f === "side") { b.side = v; again = true; }
  if (f === "image") b.image = v;
  if (f === "blabel") btns[i].label = v;
  if (f === "bstyle") btns[i].style = v;
  if (f === "burl") btns[i].action.url = v;
  if (f === "breply") btns[i].action.reply_id = v;
  if (f === "bform") btns[i].action.form_id = v;
  if (f === "bmode") btns[i].action.mode = v;
  if (f === "brole") { btns[i].action.role_id = v; again = true; }
  if (f === "bpage") { btns[i].action.page_index = Number(v); }
  if (f === "baction") {
    if (v === "link") btns[i].action = { type: "link", url: "https://" };
    if (v === "reply") btns[i].action = { type: "reply", reply_id: "" };
    if (v === "form") btns[i].action = { type: "form", form_id: "" };
    if (v === "role") btns[i].action = { type: "role", mode: "toggle", role_id: "" };
    if (v === "page") btns[i].action = { type: "page", page_index: -2 };
    again = true;
  }
  const ruled = (f === "bcd" || f === "bonce" || f === "brolechk") ? btns[i]
    : ((f === "ocd" || f === "oonce" || f === "orolechk") ? b.options[i] : null);
  if (ruled) {
    if (f.endsWith("cd")) ruled.cooldown = Math.max(0, Math.min(86400, parseInt(v, 10) || 0));
    if (f.endsWith("once")) { ruled.once = e.target.checked; again = true; }
    if (f.endsWith("rolechk")) {
      const set = new Set(ruled.allowed_roles || []);
      if (e.target.checked) set.add(e.target.dataset.rid); else set.delete(e.target.dataset.rid);
      ruled.allowed_roles = Array.from(set);
      again = true;
    }
  }
  if (f === "dph") b.placeholder = v;
  if (f === "olabel") b.options[i].label = v;
  if (f === "odesc") b.options[i].description = v;
  if (f === "oreply") b.options[i].action.reply_id = v;
  if (f === "oform") b.options[i].action.form_id = v;
  if (f === "omode") b.options[i].action.mode = v;
  if (f === "orole") { b.options[i].action.role_id = v; again = true; }
  if (f === "opage") { b.options[i].action.page_index = Number(v); }
  if (f === "oaction") {
    if (v === "reply") b.options[i].action = { type: "reply", reply_id: "" };
    if (v === "form") b.options[i].action = { type: "form", form_id: "" };
    if (v === "role") b.options[i].action = { type: "role", mode: "toggle", role_id: "" };
    if (v === "page") b.options[i].action = { type: "page", page_index: -2 };
    again = true;
  }
  markDirty();
  renderTabs();
  renderTree();
  renderPreview();
  renderStatus();
  if (again) renderSettings();
});

$("settings").addEventListener("click", async (e) => {
  const d = btnData(e);
  const act = d.act2;
  if (!act) return;
  if (act === "fmtvar") {
    const m = $("fmtVarMenu");
    if (m) {
      const open = m.classList.toggle("hidden") === false;
      const btn = e.target.closest("[data-act2=\"fmtvar\"]");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    return;
  }
  if (act === "insertvar") {
    const m = $("fmtVarMenu");
    if (m) m.classList.add("hidden");
    const vn = d.vname;
    if (vn) {
      const sel = isClassicMain() ? '#settings textarea[data-fmt-target]' : '#settings textarea[data-f="content"]';
      insertIntoField(sel, "{{" + vn + "}}");
    }
    return;
  }
  if (act === "copyvar") {
    const tok = "{{" + (d.vname || "") + "}}";
    try { await navigator.clipboard.writeText(tok); notify("Copied " + tok, "ok"); }
    catch (err) { notifyErr("Could not copy."); }
    return;
  }
  if (act === "fmtmore") {
    const m = $("fmtMore");
    if (m) {
      const open = m.classList.toggle("hidden") === false;
      const btn = e.target.closest("[data-act2=\"fmtmore\"]");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    return;
  }
  if (act === "fmt") {
    const m = $("fmtMore");
    if (m) m.classList.add("hidden");
    formatText(d.fmt);
    return;
  }
  if (act === "pickcolor") {
    const target = d.target;
    const hex = d.hex;
    if (target === "e_color" && isClassicMain()) {
      const em = cur.layout.embeds.find((x) => x.id === selId);
      if (em) em.color = hex;
    } else if (target === "accent") {
      const loc = findLoc(selId);
      if (loc && loc.list[loc.index].type === "box") loc.list[loc.index].accent = hex;
    }
    markDirty();
    renderAll();
    return;
  }
  if (act === "addvar") {
    if (!Array.isArray(cur.layout.variables)) cur.layout.variables = [];
    if (cur.layout.variables.length >= 20) return;
    cur.layout.variables.push({ id: uid(), name: "var_" + (cur.layout.variables.length + 1), default: "" });
    markDirty(); renderAll(); return;
  }
  if (act === "addvarnamed") {
    if (!Array.isArray(cur.layout.variables)) cur.layout.variables = [];
    if (cur.layout.variables.length >= 20) return;
    const vn = d.vname || "var";
    if (!cur.layout.variables.some((x) => x.name === vn)) {
      cur.layout.variables.push({ id: uid(), name: vn, default: "" });
      markDirty(); renderAll();
    }
    return;
  }
  if (act === "delvar") {
    cur.layout.variables.splice(Number(d.i), 1);
    markDirty(); renderAll(); return;
  }
  if (classicClick(act, d)) return;
  if (act === "delreply") {
    if (!await uiConfirm("Delete this reply?", { title: "Delete reply", okText: "Delete", danger: true })) return;
    cur.layout.replies = cur.layout.replies.filter((r) => r.id !== tab);
    tab = "main";
    selId = null;
    markDirty();
    renderAll();
    return;
  }
  if (act === "delpage") {
    if (!await uiConfirm("Delete this page?", { title: "Delete page", okText: "Delete", danger: true })) return;
    cur.layout.pages = (cur.layout.pages || []).filter((p) => p.id !== tab);
    tab = "main";
    selId = null;
    markDirty();
    renderAll();
    return;
  }
  if (act === "delform") {
    if (!await uiConfirm("Delete this form?", { title: "Delete form", okText: "Delete", danger: true })) return;
    cur.layout.forms = cur.layout.forms.filter((f) => f.id !== tab);
    tab = "main";
    selId = null;
    markDirty();
    renderAll();
    return;
  }
  const loc = findLoc(selId);
  if (!loc) return;
  const b = loc.list[loc.index];
  const i = Number(d.i);
  const btns = b.type === "dropdown" ? [] : buttonsOf(b);

  if (act === "emojitext") {
    pickEmoji((em) => {
      insertIntoField('[data-f="content"]', "<" + (em.animated ? "a" : "") + ":" + em.name + ":" + em.id + ">");
    });
    return;
  }
  if (act === "bemoji") {
    pickEmoji((em) => { btns[i].emoji = em; markDirty(); renderAll(); });
    return;
  }
  if (act === "bemojiclear") { delete btns[i].emoji; }
  if (act === "oemoji") {
    pickEmoji((em) => { b.options[i].emoji = em; markDirty(); renderAll(); });
    return;
  }
  if (act === "oemojiclear") { delete b.options[i].emoji; }

  if (act === "addbtn") b.buttons.push(newButton());
  if (act === "delbtn") b.buttons.splice(i, 1);
  if (act === "addopt" && b.options.length < 25) b.options.push(newOption());
  if (act === "delopt") b.options.splice(i, 1);
  markDirty();
  renderAll();
});

$("settings").addEventListener("mousedown", (e) => {
  if (e.target.closest("[data-fmt], [data-act2=\"fmtmore\"], [data-act2=\"fmtvar\"], [data-act2=\"insertvar\"]")) e.preventDefault();
});
document.addEventListener("click", (e) => {
  const m = $("fmtMore");
  if (m && !e.target.closest(".fmtmore-wrap")) m.classList.add("hidden");
  const vm = $("fmtVarMenu");
  if (vm && !e.target.closest(".fmtvar-wrap")) vm.classList.add("hidden");
});

document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.onclick = () => addBlock(btn.dataset.add);
});

let nameTouched = false;
$("nameInput").addEventListener("input", () => { nameTouched = true; markDirty(); renderStatus(); });

function firstText(blocks) {
  for (const b of blocks || []) {
    if ((b.type === "text" || b.type === "section") && String(b.content || "").trim()) return b.content;
    if (b.type === "box") { const t = firstText(b.children); if (t) return t; }
  }
  return "";
}

function guessName(layout) {
  let t = "";
  if (layout.kind === "classic") {
    const e = (layout.embeds || [])[0] || {};
    t = layout.content || e.title || e.description || "";
  } else {
    t = firstText(layout.blocks);
  }
  const line = String(t).split("\n")
    .map((x) => x.replace(/<[^>]*>/g, "").replace(/^[#>\-*\s]+/, "").replace(/[*_~`|]/g, "").replace(/\s+/g, " ").trim())
    .find(Boolean) || "";
  return line.slice(0, 60);
}

function isDefaultName(n) { return n === "Untitled message" || n === "Untitled embed"; }

$("guildSel").onchange = async () => {
  const next = $("guildSel").value;
  if (cur.posted_message_id && cur.guild_id && next !== cur.guild_id) {
    if (!await uiConfirm("Changing the server unlinks this message from the one already posted in Discord. Continue?", { title: "Change server", okText: "Continue" })) {
      $("guildSel").value = cur.layout.guild_id;
      return;
    }
    cur.posted_message_id = null;
  }
  cur.layout.guild_id = next;
  markDirty();
  await loadGuildData();
  renderAll();
};

async function loadGuilds() {
  if (guilds.length) return;
  try { guilds = await api("/guilds"); } catch (e) { guilds = []; }
}

async function loadGuildData() {
  roles = [];
  chans = [];
  const gid = cur.layout.guild_id;
  if (!gid) return;
  try { roles = await api("/guilds/" + gid + "/roles"); } catch (e) { roles = []; }
  try { chans = await api("/guilds/" + gid + "/channels"); } catch (e) { chans = []; }
}

async function save(silent) {
  while (saving) await sleep(100);
  saving = true;
  clearTimeout(autosaveTimer);
  cur.name = $("nameInput").value.trim() || "Untitled message";
  if (!nameTouched && (isDefaultName(cur.name) || cur.autoNamed)) {
    const guess = guessName(cur.layout);
    if (guess) {
      cur.name = guess;
      cur.autoNamed = true;
      $("nameInput").value = guess;
    }
  }
  const version = editCount;
  try {
    const body = JSON.stringify({ name: cur.name, layout: cur.layout });
    const saved = cur.id
      ? await api("/messages/" + cur.id + (silent ? "?auto=1" : ""), { method: "PUT", body })
      : await api("/messages", { method: "POST", body });
    cur.id = saved.id;
    cur.guild_id = saved.guild_id;
    cur.posted_message_id = saved.posted_message_id;
    cur.channel_id = saved.channel_id;
    cur.changed = !!saved.changed;
    if (editCount === version) dirty = false;
    else scheduleAutosave();
    renderStatus();
  } catch (e) {
    if (e.message !== "login" && !silent) notifyErr("Could not save: " + e.message);
  }
  saving = false;
}
$("saveBtn").onclick = () => save(false);

async function openBuilder(msg) {
  msg.layout = normalize(msg.layout || {});
  await loadGuilds();
  if (!guilds.length) {
    notifyErr("No server available. The bot must be in a server where you are an Administrator.");
    return;
  }
  if (msg.guild_id) msg.layout.guild_id = msg.guild_id;
  if (!guilds.some((g) => g.id === msg.layout.guild_id)) msg.layout.guild_id = guilds[0].id;
  cur = msg;
  selId = null;
  tab = "main";
  dirty = false;
  probKey = "";
  clearTimeout(autosaveTimer);
  resetHistory();
  $("guildSel").innerHTML = opts(guilds.map((g) => [g.id, g.name]), cur.layout.guild_id);
  $("nameInput").value = cur.name;
  nameTouched = false;
  await loadGuildData();
  show("viewBuilder");
  setPane("preview");
  treeOpen = false;
  applyTree();
  applyPv();
  applyPw();
  setMode("edit");
  renderAll();
}

let libItems = [];
let libFilter = "all";
let libQuery = "";
let libGuild = "";
try { libGuild = localStorage.getItem("last_guild") || ""; } catch (e) {}

function ago(ts) {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + " min ago";
  if (s < 86400) return Math.floor(s / 3600) + " h ago";
  if (s < 86400 * 30) return Math.floor(s / 86400) + " d ago";
  return new Date(ts * 1000).toLocaleDateString();
}

function libState(m) {
  if (!m.posted_message_id) return "draft";
  return m.changed ? "changed" : "posted";
}

function libMatches(m, filter) {
  if (libGuild && String(m.guild_id) !== libGuild) return false;
  if (libQuery && !String(m.name).toLowerCase().includes(libQuery)) return false;
  return filter === "all" || libState(m) === filter;
}

function renderLibChips() {
  const defs = [["all", "All"], ["draft", "Drafts"], ["posted", "Posted"], ["changed", "Changed"]];
  $("libChips").innerHTML = defs.map(([k, label]) => {
    const n = libItems.filter((m) => libMatches(m, k)).length;
    return '<button type="button" class="chip' + (libFilter === k ? " on" : "") + '" data-chip="' + k + '">' + label + "<b>" + n + "</b></button>";
  }).join("");
}

function closeCardMenus() {
  document.querySelectorAll(".cardmenu").forEach((m) => m.classList.add("hidden"));
  document.querySelectorAll("[data-cardmenu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

function libRow(m) {
  const st = libState(m);
  const badges = (st === "draft" ? '<span class="badge draft">Draft</span>' : '<span class="badge ok">Posted</span>') +
    (st === "changed" ? '<span class="badge warn" title="You edited it after posting. Press Update post to refresh it in Discord.">Changed</span>' : "") +
    (m.webhook_id ? '<span class="badge hook">Webhook</span>' : "");
  return '<div class="lrow st-' + st + '"><div class="lmain"><div class="ltitle"><b>' + esc(m.name) + "</b>" + badges + '</div>' +
    '<div class="lmeta">' + esc(m.guild_id ? guildName(m.guild_id) : "No server") + " &middot; Updated " +
    '<span title="' + esc(new Date(m.updated_at * 1000).toLocaleString()) + '">' + esc(ago(m.updated_at)) + "</span></div></div>" +
    '<div class="lacts">' +
    '<button class="primary small" data-open="' + esc(m.id) + '">' + ic("edit") + "Open</button>" +
    '<div class="cardmenu-wrap"><button class="small ib" data-cardmenu="' + esc(m.id) + '" title="More options" aria-label="More options" aria-haspopup="true" aria-expanded="false">' + ic("more") + "</button>" +
    '<div class="cardmenu hidden" role="menu">' +
    '<button class="small" role="menuitem" data-copy="' + esc(m.id) + '">' + ic("copy") + "Make a copy</button>" +
    '<button class="small" role="menuitem" data-export="' + esc(m.id) + '">' + ic("export") + "Export JSON</button>" +
    '<button class="small danger" role="menuitem" data-del="' + esc(m.id) + '">' + ic("trash") + "Delete</button>" +
    "</div></div></div></div>";
}

function renderLibList() {
  if (!libItems.length) {
    $("list").innerHTML = '<div class="lempty"><b>No messages yet</b>Press New at the top to design your first one.</div>';
    return;
  }
  const shown = libItems.filter((m) => libMatches(m, libFilter));
  $("list").innerHTML = shown.length
    ? shown.map(libRow).join("")
    : '<div class="lempty"><b>Nothing matches</b>Try a different word or press All.</div>';
}

function loadFavGuilds() {
  try { return new Set(JSON.parse(localStorage.getItem("fav_guilds") || "[]")); }
  catch (e) { return new Set(); }
}

function toggleFavGuild(gid) {
  const favs = loadFavGuilds();
  if (favs.has(gid)) favs.delete(gid); else favs.add(gid);
  try { localStorage.setItem("fav_guilds", JSON.stringify(Array.from(favs))); } catch (e) {}
  renderServerPicker();
}

function renderServerPicker() {
  const el = $("serverPicker");
  if (!el) return;
  if (guilds.length < 2) { el.classList.add("hidden"); el.innerHTML = ""; return; }
  el.classList.remove("hidden");
  const favs = loadFavGuilds();
  const sorted = guilds.slice().sort((a, b) => (favs.has(b.id) ? 1 : 0) - (favs.has(a.id) ? 1 : 0));
  el.innerHTML = '<div class="srvcard' + (libGuild === "" ? " on" : "") + '" data-pickguild="">' +
    '<div class="srvicon">All</div><div class="srvmeta"><b>All servers</b><small>' + libItems.length + ' message(s)</small></div></div>' +
    sorted.map((g) => {
      const icon = g.icon_url
        ? '<img class="srvicon" src="' + esc(g.icon_url) + '" alt="">'
        : '<div class="srvicon">' + esc((g.name || "?").slice(0, 2).toUpperCase()) + '</div>';
      const cnt = g.message_count !== undefined ? g.message_count : libItems.filter((m) => String(m.guild_id) === g.id).length;
      const fav = favs.has(g.id);
      return '<div class="srvcard' + (libGuild === g.id ? " on" : "") + '" data-pickguild="' + esc(g.id) + '">' +
        icon + '<div class="srvmeta"><b>' + esc(g.name) + '</b><small>' + cnt + ' msg(s)' +
        (g.last_edit ? ' &middot; ' + esc(ago(g.last_edit)) : '') + '</small></div>' +
        '<button type="button" class="srvfav' + (fav ? " on" : "") + '" data-favguild="' + esc(g.id) + '" title="Pin server">' + (fav ? "★" : "☆") + '</button></div>';
    }).join("");
}
function renderLibrary() {
  $("libTools").classList.toggle("hidden", !libItems.length);
  const multi = guilds.length > 1;
  $("libGuild").classList.toggle("hidden", !multi);
  if (multi) $("libGuild").innerHTML = opts([["", "All servers"]].concat(guilds.map((g) => [g.id, g.name])), libGuild);
  renderServerPicker();
  renderLibChips();
  renderLibList();
}

$("libSearch").addEventListener("input", () => {
  libQuery = $("libSearch").value.trim().toLowerCase();
  renderLibChips();
  renderLibList();
});
$("libGuild").addEventListener("change", () => {
  libGuild = $("libGuild").value;
  try { localStorage.setItem("last_guild", libGuild); } catch (e) {}
  renderServerPicker();
  renderLibChips();
  renderLibList();
});
$("serverPicker").addEventListener("click", (e) => {
  const fav = e.target.closest("[data-favguild]");
  if (fav) { e.stopPropagation(); toggleFavGuild(fav.dataset.favguild); return; }
  const card = e.target.closest("[data-pickguild]");
  if (!card) return;
  libGuild = card.dataset.pickguild;
  try { localStorage.setItem("last_guild", libGuild); } catch (e) {}
  if ($("libGuild")) $("libGuild").value = libGuild;
  renderServerPicker();
  renderLibChips();
  renderLibList();
});
$("libChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-chip]");
  if (!b) return;
  libFilter = b.dataset.chip;
  renderLibChips();
  renderLibList();
});

async function openLibrary() {
  clearTimeout(autosaveTimer);
  show("viewLibrary");
  $("list").innerHTML = '<div class="skel-card"></div>'.repeat(6);
  try {
    await loadGuilds();
    libItems = await api("/messages");
    if (libGuild && !guilds.some((g) => g.id === libGuild)) libGuild = "";
    renderLibrary();
  } catch (e) {
    if (e.message !== "login") $("list").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
}

$("list").addEventListener("click", async (e) => {
  const d = btnData(e);
  if (d.cardmenu) {
    e.stopPropagation();
    const wrap = e.target.closest(".cardmenu-wrap");
    const menu = wrap && wrap.querySelector(".cardmenu");
    const wasOpen = menu && !menu.classList.contains("hidden");
    closeCardMenus();
    if (menu && !wasOpen) {
      menu.classList.remove("hidden");
      e.target.closest("[data-cardmenu]").setAttribute("aria-expanded", "true");
    }
    return;
  }
  closeCardMenus();
  try {
    if (d.open) await openBuilder(await api("/messages/" + d.open));
    if (d.copy) {
      const m = await api("/messages/" + d.copy);
      await api("/messages", {
        method: "POST",
        body: JSON.stringify({ name: (m.name + " (copy)").slice(0, 100), layout: m.layout }),
      });
      notify("Copy created.", "ok");
      openLibrary();
    }
    if (d.export) {
      const data = await api("/messages/" + d.export + "/export");
      downloadJson(data.name || "message", data);
      notify("Exported as a file.", "ok");
    }
    if (d.del && await uiConfirm("Delete this message from the dashboard? Its schedules are deleted too. (A posted Discord message is not removed.)", { title: "Delete message", okText: "Delete", danger: true })) {
      await api("/messages/" + d.del, { method: "DELETE" });
      notify("Message deleted.", "ok");
      openLibrary();
    }
  } catch (err) {
    if (err.message !== "login") notifyErr(err.message);
  }
});

$("newLayoutBtn").onclick = () => {
  closeNewMenu();
  const box = newBlock("box");
  box.children.push({ id: uid(), type: "text", content: "# Hello there\nStart writing your message." });
  openBuilder({ id: null, name: "Untitled message", layout: { blocks: [box], replies: [], forms: [] } });
};

$("backBtn").onclick = async () => {
  if (dirty && !await uiConfirm("Discard unsaved changes?", { title: "Unsaved changes", okText: "Discard", danger: true })) return;
  dirty = false;
  openLibrary();
};

$("loginBtn").onclick = () => {
  const n = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  try { localStorage.setItem("login_nonce", n); } catch (e) {}
  location.href = API_URL + "/auth/login?n=" + n;
};
$("logoutBtn").onclick = async () => {
  try { await api("/logout", { method: "POST" }); } catch (e) {}
  clearToken();
  emojiData = null;
  guilds = [];
  show("viewLogin");
  $("loginMsg").textContent = "Logged out.";
};

/* ---------- Server tools: backup, import, templates ---------- */
function toolsStatus(t) { $("toolsStatus").textContent = t; }

async function loadToolsTemplates() {
  const gid = $("toolsGuild").value;
  if (!gid) { $("toolsTemplates").innerHTML = ""; return; }
  $("toolsTemplates").innerHTML = '<p class="muted">Loading...</p>';
  try {
    const list = await api("/guilds/" + gid + "/templates");
    $("toolsTemplates").innerHTML = list.length
      ? list.map((t) =>
        '<div class="mrow"><div class="grow"><b>' + esc(t.name) + '</b><div class="muted">' +
        new Date(t.created_at * 1000).toLocaleDateString() + '</div></div>' +
        '<button class="primary small" data-use="' + esc(t.id) + '">' + ic("check") + "Use</button>" +
        '<button class="small ib danger" data-rmtpl="' + esc(t.id) + '" title="Delete">' + ic("trash") + "</button></div>").join("")
      : '<p class="muted">No templates yet. Open a message and tap "Template" to save one.</p>';
  } catch (e) {
    if (e.message !== "login") $("toolsTemplates").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
}

$("toolsBtn").onclick = async () => {
  await loadGuilds();
  if (!guilds.length) { notifyErr("No server available."); return; }
  $("toolsGuild").innerHTML = opts(guilds.map((g) => [g.id, g.name]), "");
  toolsStatus("");
  $("toolsOverlay").classList.remove("hidden");
  loadToolsTemplates();
  loadToolsSequences();
  loadToolsPersonas();
};

$("toolsGuild").onchange = () => { toolsStatus(""); loadToolsTemplates(); loadToolsSequences(); loadToolsPersonas(); };
$("toolsClose").onclick = () => { $("toolsOverlay").classList.add("hidden"); };
$("toolsOverlay").onclick = (e) => { if (e.target === $("toolsOverlay")) $("toolsOverlay").classList.add("hidden"); };

$("toolsBackup").onclick = async () => {
  const gid = $("toolsGuild").value;
  toolsStatus("Preparing backup...");
  try {
    const data = await api("/guilds/" + gid + "/backup");
    downloadJson("backup-" + guildName(gid), data);
    toolsStatus("Downloaded: " + data.messages.length + " message(s), " + data.templates.length + " template(s).");
  } catch (e) {
    if (e.message !== "login") toolsStatus("Failed: " + e.message);
  }
};

$("toolsImport").onclick = () => { $("importFile").click(); };

$("importFile").addEventListener("change", async () => {
  const file = $("importFile").files[0];
  $("importFile").value = "";
  if (!file) return;
  const gid = $("toolsGuild").value;
  toolsStatus("Importing...");
  try {
    const text = await file.text();
    let data;
    try { data = JSON.parse(text); } catch (err) { toolsStatus("That file isn't valid JSON."); return; }
    const r = await api("/guilds/" + gid + "/import", { method: "POST", body: JSON.stringify({ data }) });
    toolsStatus("Imported " + r.messages + " message(s) and " + r.templates + " template(s)." +
      (r.stripped ? " The file came from another server, so roles and form channels were cleared. Choose them again." : ""));
    loadToolsTemplates();
  } catch (e) {
    if (e.message !== "login") toolsStatus("Failed: " + e.message);
  }
});

$("toolsTemplates").addEventListener("click", async (e) => {
  const d = btnData(e);
  try {
    if (d.use) {
      const t = await api("/templates/" + d.use);
      $("toolsOverlay").classList.add("hidden");
      await openBuilder({ id: null, name: t.name, guild_id: t.guild_id, layout: t.layout });
    }
    if (d.rmtpl && await uiConfirm("Delete this template?", { title: "Delete template", okText: "Delete", danger: true })) {
      await api("/templates/" + d.rmtpl, { method: "DELETE" });
      loadToolsTemplates();
    }
  } catch (err) {
    if (err.message !== "login") toolsStatus("Failed: " + err.message);
  }
});

/* ---------- Message sequences (Phase 3.6) ---------- */
async function loadToolsSequences() {
  const gid = $("toolsGuild").value;
  if (!gid) { $("toolsSequences").innerHTML = ""; return; }
  $("toolsSequences").innerHTML = '<p class="muted">Loading...</p>';
  try {
    const [seqs, chansList] = await Promise.all([
      api("/guilds/" + gid + "/sequences"),
      api("/guilds/" + gid + "/channels"),
    ]);
    $("seqChannel").innerHTML = chansList.length
      ? chansList.map((c) => '<option value="' + esc(c.id) + '">#' + esc(c.name) + "</option>").join("")
      : "<option value=''>No channel the bot can write in</option>";
    const gMsgs = libItems.filter((m) => String(m.guild_id) === gid);
    $("seqMsgChecks").innerHTML = gMsgs.length
      ? gMsgs.map((m) =>
        '<label style="text-transform:none;display:flex;gap:8px;align-items:center;letter-spacing:0;margin:3px 0">' +
        '<input type="checkbox" class="seq-chk" value="' + esc(m.id) + '"> ' + esc(m.name) + "</label>"
      ).join("")
      : '<p class="muted">No saved messages in this server yet.</p>';
    $("toolsSequences").innerHTML = seqs.length
      ? seqs.map((s) =>
        '<div class="mrow"><div class="grow"><b>' + esc(s.name) + '</b>' +
        '<div class="muted">' + s.message_ids.length + ' message(s)</div></div>' +
        '<button class="primary small" data-postseq="' + esc(s.id) + '">' + ic("send") + "Post all</button>" +
        '<button class="small ib danger" data-rmseq="' + esc(s.id) + '" title="Delete">' + ic("trash") + "</button></div>"
      ).join("")
      : '<p class="muted">No sequences yet.</p>';
  } catch (e) {
    if (e.message !== "login") $("toolsSequences").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
}

$("seqAdd").onclick = async () => {
  const gid = $("toolsGuild").value;
  const name = $("seqName").value.trim();
  const ids = Array.from(document.querySelectorAll(".seq-chk:checked")).map((c) => Number(c.value));
  if (!name) { toolsStatus("Type a name for the sequence."); return; }
  if (!ids.length || ids.length > 10) { toolsStatus("Select 1 to 10 messages."); return; }
  toolsStatus("Saving sequence...");
  try {
    await api("/guilds/" + gid + "/sequences", {
      method: "POST",
      body: JSON.stringify({ name, message_ids: ids }),
    });
    $("seqName").value = "";
    toolsStatus("Sequence saved.");
    loadToolsSequences();
  } catch (e) {
    if (e.message !== "login") toolsStatus("Failed: " + e.message);
  }
};

$("toolsSequences").addEventListener("click", async (e) => {
  const d = btnData(e);
  try {
    if (d.postseq) {
      const ch = $("seqChannel").value;
      if (!ch) { toolsStatus("Choose a channel first."); return; }
      toolsStatus("Posting sequence...");
      const r = await api("/sequences/" + d.postseq + "/post-all", {
        method: "POST",
        body: JSON.stringify({ channel_id: ch }),
      });
      toolsStatus("Posted " + r.posted + " message(s) in order!");
    }
    if (d.rmseq && await uiConfirm("Delete this sequence?", { title: "Delete sequence", okText: "Delete", danger: true })) {
      await api("/sequences/" + d.rmseq, { method: "DELETE" });
      loadToolsSequences();
    }
  } catch (err) {
    if (err.message !== "login") toolsStatus("Failed: " + err.message);
  }
});

/* ---------- Webhook presets ---------- */
async function loadToolsPersonas() {
  const gid = $("toolsGuild").value;
  if (!gid) { $("toolsPersonas").innerHTML = ""; return; }
  $("toolsPersonas").innerHTML = '<p class="muted">Loading...</p>';
  try {
    const list = await api("/guilds/" + gid + "/personas");
    $("toolsPersonas").innerHTML = list.length
      ? list.map((p) =>
        '<div class="mrow">' +
        (p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">' : "") +
        '<div class="grow"><b>' + esc(p.name) + '</b></div>' +
        '<button class="small ib danger" data-rmpersona="' + esc(p.id) + '" title="Delete">' + ic("trash") + "</button></div>").join("")
      : '<p class="muted">No presets yet.</p>';
  } catch (e) {
    if (e.message !== "login") $("toolsPersonas").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
}

$("personaAdd").onclick = async () => {
  const gid = $("toolsGuild").value;
  const name = $("personaName").value.trim();
  if (!name) { toolsStatus("Type a name for the preset."); return; }
  toolsStatus("Saving...");
  try {
    await api("/guilds/" + gid + "/personas", {
      method: "POST",
      body: JSON.stringify({ name, avatar_url: $("personaAvatar").value.trim() }),
    });
    $("personaName").value = "";
    $("personaAvatar").value = "";
    toolsStatus("Preset saved.");
    loadToolsPersonas();
  } catch (e) {
    if (e.message !== "login") toolsStatus("Failed: " + e.message);
  }
};

$("toolsPersonas").addEventListener("click", async (e) => {
  const id = btnData(e).rmpersona;
  if (!id || !await uiConfirm("Delete this preset?", { title: "Delete preset", okText: "Delete", danger: true })) return;
  try {
    await api("/personas/" + id, { method: "DELETE" });
    loadToolsPersonas();
  } catch (err) {
    if (err.message !== "login") toolsStatus("Failed: " + err.message);
  }
});

/* ---------- Save as template, version history ---------- */
$("tplBtn").onclick = async () => {
  const name = await uiPrompt("Save as template", cur.name || "Untitled message", "Choose a name for this reusable template.");
  if (!name || !name.trim()) return;
  try {
    await api("/guilds/" + cur.layout.guild_id + "/templates", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), layout: cur.layout }),
    });
    notify("Template saved for " + guildName(cur.layout.guild_id) + ".", "ok");
  } catch (e) {
    if (e.message !== "login") notifyErr("Could not save the template: " + e.message);
  }
};

$("histBtn").onclick = async () => {
  if (!cur.id) { notify("Save the message first.", "info"); return; }
  $("histList").innerHTML = '<p class="muted">Loading...</p>';
  $("histOverlay").classList.remove("hidden");
  try {
    const list = await api("/messages/" + cur.id + "/versions");
    $("histList").innerHTML = list.length
      ? list.map((v) =>
        '<div class="mrow"><div class="grow"><b>' + new Date(v.created_at * 1000).toLocaleString() +
        '</b><div class="muted">' + esc(v.name || "") + '</div></div>' +
        '<button class="primary small" data-restore="' + esc(v.id) + '">' + ic("history") + "Restore</button></div>").join("")
      : '<p class="muted">No versions yet. A snapshot is saved the next time you post or update this message.</p>';
  } catch (e) {
    if (e.message !== "login") $("histList").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
};

$("histList").addEventListener("click", async (e) => {
  const vid = btnData(e).restore;
  if (!vid) return;
  if (!await uiConfirm("Replace the current design with this version? You can still use Undo afterwards.", { title: "Restore version", okText: "Restore" })) return;
  try {
    const v = await api("/messages/" + cur.id + "/versions/" + vid);
    const keepGuild = cur.layout.guild_id;
    cur.layout = normalize(v.layout);
    cur.layout.guild_id = keepGuild;
    selId = null;
    tab = "main";
    markDirty();
    renderAll();
    $("histOverlay").classList.add("hidden");
  } catch (err) {
    if (err.message !== "login") notifyErr(err.message);
  }
});

$("histClose").onclick = () => { $("histOverlay").classList.add("hidden"); };
$("histOverlay").onclick = (e) => { if (e.target === $("histOverlay")) $("histOverlay").classList.add("hidden"); };

/* ---------- Scheduling ---------- */
const tzName = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; }
})();
const pad2 = (n) => String(n).padStart(2, "0");

function schedStatus(t) { $("schedStatus").textContent = t; }

function channelName(id) {
  const c = chans.find((x) => x.id === String(id));
  return c ? c.name : "unknown-channel";
}

function scheduleRow(s) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let when = "once on " + s.run_date;
  if (s.repeat === "daily") when = "every day";
  if (s.repeat === "weekly") when = "every " + days[new Date(s.run_date + "T12:00:00").getDay()];
  const what = s.action === "post"
    ? "Post to #" + channelName(s.channel_id) + (s.replace_previous ? " (replaces the previous post)" : "")
    : "Update the posted message";
  const next = s.active ? "Next: " + new Date(s.next_run * 1000).toLocaleString() : "Finished";
  const last = s.last_status ? " | Last: " + s.last_status : "";
  return '<div class="mrow"><div class="grow"><b>' + esc(what) + '</b>' +
    '<div class="muted">' + esc(when + " at " + s.run_time + " (" + s.tz + ")") + '</div>' +
    '<div class="muted">' + esc(next + last) + '</div></div>' +
    '<button class="small ib danger" data-sdel="' + esc(s.id) + '" title="Delete">' + ic("trash") + "</button></div>";
}

async function loadSchedules() {
  $("schedList").innerHTML = '<p class="muted">Loading...</p>';
  try {
    const list = await api("/messages/" + cur.id + "/schedules");
    $("schedList").innerHTML = list.length
      ? list.map(scheduleRow).join("")
      : '<p class="muted">Nothing scheduled for this message yet.</p>';
  } catch (e) {
    if (e.message !== "login") $("schedList").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
}

function syncSchedForm() {
  const post = $("schedAction").value === "post";
  $("schedChanWrap").classList.toggle("hidden", !post);
  $("schedReplaceWrap").classList.toggle("hidden", !post);
}

$("schedAction").onchange = syncSchedForm;

$("schedBtn").onclick = async () => {
  const probs = problems();
  if (probs.length) { jumpToProblem(probs[0]); notifyErr("Fix this first: " + probs[0].msg); return; }
  await save(false);
  if (dirty || !cur.id) return;
  $("schedTz").textContent = "Times use your browser's time zone: " + tzName + ".";
  const t = new Date(Date.now() + 3600000);
  $("schedDate").value = t.getFullYear() + "-" + pad2(t.getMonth() + 1) + "-" + pad2(t.getDate());
  $("schedTime").value = pad2(t.getHours()) + ":00";
  $("schedChannel").innerHTML = chans.length
    ? chans.map((c) => '<option value="' + esc(c.id) + '">#' + esc(c.name) + "</option>").join("")
    : "<option value=''>No channel the bot can write in</option>";
  if (cur.channel_id && chans.some((c) => c.id === cur.channel_id)) $("schedChannel").value = cur.channel_id;
  syncSchedForm();
  schedStatus("");
  $("schedOverlay").classList.remove("hidden");
  loadSchedules();
};

$("schedAdd").onclick = async () => {
  const action = $("schedAction").value;
  const body = {
    action,
    channel_id: action === "post" ? $("schedChannel").value : "",
    run_date: $("schedDate").value,
    run_time: $("schedTime").value,
    tz: tzName,
    repeat: $("schedRepeat").value,
    replace_previous: action === "post" && $("schedReplace").checked,
  };
  if (!body.run_date || !body.run_time) { schedStatus("Choose a date and a time."); return; }
  if (action === "post" && !body.channel_id) { schedStatus("Choose a channel."); return; }
  schedStatus("Adding...");
  try {
    await api("/messages/" + cur.id + "/schedules", { method: "POST", body: JSON.stringify(body) });
    schedStatus("Schedule added.");
    await loadSchedules();
  } catch (e) {
    if (e.message !== "login") schedStatus("Failed: " + e.message);
  }
};

$("schedList").addEventListener("click", async (e) => {
  const id = btnData(e).sdel;
  if (!id) return;
  if (!await uiConfirm("Delete this schedule?", { title: "Delete schedule", okText: "Delete", danger: true })) return;
  try {
    await api("/schedules/" + id, { method: "DELETE" });
    await loadSchedules();
  } catch (err) {
    if (err.message !== "login") schedStatus("Failed: " + err.message);
  }
});

$("schedClose").onclick = () => { $("schedOverlay").classList.add("hidden"); };
$("schedOverlay").onclick = (e) => { if (e.target === $("schedOverlay")) $("schedOverlay").classList.add("hidden"); };

/* ---------- Admin page (owner only) ---------- */
async function openAdmin() {
  show("viewAdmin");
  $("adminAllowed").innerHTML = '<p class="muted">Loading...</p>';
  $("adminPending").innerHTML = "";
  try {
    const d = await api("/admin/servers");
    const st = d.storage || { size_bytes: 0, counts: {} };
    const kb = st.size_bytes / 1024;
    $("adminStorage").textContent = "Database: " + (kb >= 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.round(kb) + " KB") +
      " of about 512 MB on the free host. Messages: " + (st.counts.messages || 0) +
      ", saved versions: " + (st.counts.versions || 0) + ", schedules: " + (st.counts.schedules || 0) +
      ", templates: " + (st.counts.templates || 0) + ".";
    $("adminAllowed").innerHTML = d.allowed.length
      ? d.allowed.map((g) =>
        '<div class="row"><div class="grow"><b>' + esc(g.name || "(unknown)") + '</b><div class="muted">' + esc(g.id) +
        (g.joined ? "" : " &middot; the bot is not in this server") + '</div></div>' +
        '<button class="small danger" data-rm="' + esc(g.id) + '">' + ic("trash") + "Remove</button></div>").join("")
      : '<p class="muted">None yet.</p>';
    const reqs = d.requests || [];
    $("adminRequests").innerHTML = reqs.length
      ? reqs.map((r) =>
        '<div class="row"><div class="grow"><b>' + esc(r.guild_name) + '</b><div class="muted">' + esc(r.guild_id) +
        ' &middot; by ' + esc(r.username) + ' &middot; ' + new Date(r.created_at * 1000).toLocaleString() + '</div></div>' +
        '<button class="primary small" data-reqok="' + esc(r.id) + '">' + ic("check") + 'Approve</button>' +
        '<button class="small" data-reqno="' + esc(r.id) + '">' + ic("close") + 'Dismiss</button></div>'
      ).join("")
      : '<p class="muted">None.</p>';
    $("adminPending").innerHTML = d.pending.length
      ? d.pending.map((p) =>
        '<div class="row"><div class="grow"><b>' + esc(p.name || "(unknown)") + '</b><div class="muted">' + esc(p.guild_id) +
        " &middot; " + new Date(p.seen_at * 1000).toLocaleString() + '</div></div>' +
        '<button class="primary small" data-ok="' + esc(p.guild_id) + '" data-name="' + esc(p.name || "") + '">' + ic("check") + "Approve</button>" +
        '<button class="small" data-dismiss="' + esc(p.guild_id) + '">' + ic("close") + "Dismiss</button></div>").join("")
      : '<p class="muted">None.</p>';
  } catch (e) {
    if (e.message !== "login") $("adminAllowed").innerHTML = '<p class="muted">Could not load: ' + esc(e.message) + "</p>";
  }
}

$("adminBtn").onclick = openAdmin;
$("adminBack").onclick = () => openLibrary();

$("adminAddBtn").onclick = async () => {
  const id = $("adminGuildId").value.trim();
  if (!/^\d+$/.test(id)) { notifyErr("A server ID is only numbers."); return; }
  try {
    await api("/admin/allow", { method: "POST", body: JSON.stringify({ guild_id: id, name: "" }) });
    $("adminGuildId").value = "";
    guilds = [];
    openAdmin();
  } catch (e) {
    if (e.message !== "login") notifyErr(e.message);
  }
};

$("adminAllowed").addEventListener("click", async (e) => {
  const id = btnData(e).rm;
  if (!id) return;
  if (!await uiConfirm("Remove this server? The bot will leave it right away and its administrators lose access.", { title: "Remove server", okText: "Remove", danger: true })) return;
  try {
    await api("/admin/allow/" + id, { method: "DELETE" });
    guilds = [];
    openAdmin();
  } catch (err) {
    if (err.message !== "login") notifyErr(err.message);
  }
});

$("adminRequests").addEventListener("click", async (e) => {
  const d = btnData(e);
  try {
    if (d.reqok) {
      await api("/admin/requests/" + d.reqok + "/approve", { method: "POST" });
      notify("Approved server request.", "ok");
      guilds = [];
      openAdmin();
    }
    if (d.reqno) {
      await api("/admin/requests/" + d.reqno, { method: "DELETE" });
      openAdmin();
    }
  } catch (err) {
    if (err.message !== "login") notifyErr(err.message);
  }
});
$("adminPending").addEventListener("click", async (e) => {
  const d = btnData(e);
  try {
    if (d.ok) {
      await api("/admin/allow", { method: "POST", body: JSON.stringify({ guild_id: d.ok, name: d.name || "" }) });
      notify("Approved. Ask them to add the bot to their server again.", "ok");
      guilds = [];
      openAdmin();
    }
    if (d.dismiss) {
      await api("/admin/pending/" + d.dismiss, { method: "DELETE" });
      openAdmin();
    }
  } catch (err) {
    if (err.message !== "login") notifyErr(err.message);
  }
});

/* ---------- Send window ---------- */
const sg = $("sendGuild");
const sc = $("sendChannel");
const ss = $("sendStatus");
const postBtn = $("sendPost");
const updBtn = $("sendUpdate");
const delBtn = $("sendDelete");
let fresh = null;

function setStatus(t) { ss.textContent = t; }

function refreshSendButtons() {
  const posted = !!(fresh && fresh.posted_message_id);
  updBtn.disabled = !posted;
  delBtn.disabled = !posted;
}

async function loadSendChannels(gid, wanted) {
  sc.innerHTML = "<option>Loading...</option>";
  try {
    const list = await api("/guilds/" + gid + "/channels");
    if (!list.length) {
      sc.innerHTML = "<option value=''>No channel the bot can write in</option>";
      return;
    }
    sc.innerHTML = list.map((c) =>
      '<option value="' + esc(c.id) + '">#' + esc(c.name) + (c.category ? " (" + esc(c.category) + ")" : "") + "</option>"
    ).join("");
    if (wanted && list.some((c) => c.id === wanted)) sc.value = wanted;
  } catch (e) {
    if (e.message !== "login") setStatus(e.message);
  }
}

$("sendBtn").onclick = async () => {
  const probs = problems();
  if (probs.length) { jumpToProblem(probs[0]); notifyErr("Fix this first: " + probs[0].msg); return; }
  await save(false);
  if (dirty || !cur.id) return;
  try {
    fresh = await api("/messages/" + cur.id);
    const gid = fresh.guild_id || cur.layout.guild_id;
    sg.innerHTML = opts([[gid, guildName(gid)]], gid);
    sg.disabled = true;
    setStatus(fresh.posted_message_id
      ? (fresh.webhook_id ? "Posted through a webhook. Update and Delete use that webhook." : "Already posted once. You can update it or post a new copy.")
      : "Not posted yet.");
    refreshSendButtons();
    $("sendOverlay").classList.remove("hidden");
    await loadSendChannels(gid, fresh.channel_id);
    await loadSendAs(gid);
    renderSendVars();
  } catch (e) {
    if (e.message !== "login") notifyErr(e.message);
  }
};

async function loadSendAs(gid) {
  let list = [];
  try { list = await api("/guilds/" + gid + "/personas"); } catch (e) { list = []; }
  $("sendAs").innerHTML = '<option value="">The bot (normal)</option>' +
    list.map((p) => '<option value="' + esc(p.id) + '">Webhook: ' + esc(p.name) + "</option>").join("");
}

function renderSendVars() {
  const wrap = $("sendVarsWrap");
  const vars = (cur && cur.layout && cur.layout.variables) || [];
  if (!vars.length) { wrap.classList.add("hidden"); wrap.innerHTML = ""; return; }
  wrap.classList.remove("hidden");
  wrap.innerHTML = '<label style="margin-bottom:4px">Fill in variables before sending</label>' +
    vars.map((v) => {
      const val = varTestValues[v.name] !== undefined ? varTestValues[v.name] : (v.default || "");
      return '<div style="margin-bottom:6px"><small class="muted">{{' + esc(v.name) + '}}</small>' +
        '<input data-sendvar="' + esc(v.name) + '" value="' + esc(val) + '" placeholder="' + esc(v.default || "value...") + '"></div>';
    }).join("");
}

function collectSendVars() {
  const out = {};
  document.querySelectorAll("[data-sendvar]").forEach((inp) => {
    out[inp.dataset.sendvar] = inp.value;
  });
  return out;
}
async function send(path, withTarget, extra) {
  setStatus("Sending...");
  postBtn.disabled = true;
  updBtn.disabled = true;
  delBtn.disabled = true;
  try {
    const o = { method: "POST" };
    const sv = collectSendVars();
    if (withTarget) o.body = JSON.stringify({ guild_id: sg.value, channel_id: sc.value, variables: sv, ...(extra || {}) });
    else if (Object.keys(sv).length) o.body = JSON.stringify({ variables: sv });
    fresh = await api("/messages/" + cur.id + path, o);
    cur.posted_message_id = fresh.posted_message_id;
    cur.channel_id = fresh.channel_id;
    cur.webhook_id = fresh.webhook_id;
    cur.changed = !!fresh.changed;
    setStatus("Done! Check Discord.");
  } catch (e) {
    if (e.message !== "login") setStatus("Failed: " + e.message);
  }
  postBtn.disabled = false;
  refreshSendButtons();
}

postBtn.onclick = () => {
  const pid = $("sendAs").value;
  if (!pid) { send("/post", true); return; }
  send("/post-webhook", true, { persona_id: Number(pid) });
};
updBtn.onclick = () => send("/update", false);

delBtn.onclick = async () => {
  if (!await uiConfirm("Delete the posted message from Discord? Your saved design stays in the dashboard.", { title: "Delete from Discord", okText: "Delete", danger: true })) return;
  setStatus("Deleting...");
  try {
    fresh = await api("/messages/" + cur.id + "/posted", { method: "DELETE" });
    cur.posted_message_id = null;
    setStatus("Deleted from Discord. You can post it again.");
  } catch (e) {
    if (e.message !== "login") setStatus("Failed: " + e.message);
  }
  refreshSendButtons();
};

$("dmBtn").onclick = async () => {
  const probs = problems();
  if (probs.length) { jumpToProblem(probs[0]); notifyErr("Fix this first: " + probs[0].msg); return; }
  await save(false);
  if (dirty || !cur.id) return;
  try {
    await api("/messages/" + cur.id + "/test", { method: "POST" });
    toast("Test sent. Check your Discord DMs.");
  } catch (e) {
    if (e.message !== "login") notifyErr(e.message);
  }
};
$("sendClose").onclick = () => { $("sendOverlay").classList.add("hidden"); };
$("sendOverlay").onclick = (e) => { if (e.target === $("sendOverlay")) $("sendOverlay").classList.add("hidden"); };

async function start() {
  applyPv();
  applyPw();
  if (!loadToken()) {
    show("viewLogin");
    if (loginError) $("loginMsg").textContent = loginError;
    return;
  }
  try {
    const me = await api("/me");
    isOwner = !!me.is_owner;
    $("adminBtn").classList.toggle("hidden", !isOwner);
    openLibrary();
    try { if (!localStorage.getItem("tour_seen")) { localStorage.setItem("tour_seen", "1"); $("helpOverlay").classList.remove("hidden"); } } catch (e) {}
  } catch (e) {
    if (e.message === "login") return;
    show("viewLogin");
    $("loginMsg").textContent = e instanceof TypeError ? "Could not reach the bot. Is it online?" : e.message;
  }
}
document.addEventListener("click", (e) => {
  if (!e.target.closest(".cardmenu-wrap")) closeCardMenus();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("dialogOverlay").classList.contains("hidden")) { closeDialog(false); return; }
    closeCardMenus();
    $("problemList").classList.add("hidden");
    hideAddMenu();
    const fm = $("fmtMore");
    if (fm) fm.classList.add("hidden");
    for (const id of ["sendOverlay", "toolsOverlay", "histOverlay", "schedOverlay", "emojiOverlay", "rawJsonOverlay", "galleryOverlay", "helpOverlay"]) {
      if (!$(id).classList.contains("hidden")) { $(id).classList.add("hidden"); if (id === "emojiOverlay") emojiCb = null; }
    }
    return;
  }
  if ($("viewBuilder").classList.contains("hidden")) return;
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const k = e.key.toLowerCase();
  if (k === "s") { e.preventDefault(); save(false); return; }
  if (e.target.closest("input, textarea, select")) return;
  if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
  else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
});

$("varPlayground").addEventListener("input", (e) => {
  const k = e.target.dataset.vp;
  if (!k) return;
  varTestValues[k] = e.target.value;
  renderPreview();
});
$("varPlayground").addEventListener("click", async (e) => {
  if (e.target.id === "vpToggleBtn") { varPlayOpen = !varPlayOpen; renderVarPlayground(); return; }
  if (e.target.id === "vpResetBtn") { varTestValues = {}; renderPreview(); return; }
  if (e.target.id === "vpServerBtn" && cur && cur.id) {
    try {
      const vals = {};
      (cur.layout.variables || []).forEach((v) => {
        vals[v.name] = varTestValues[v.name] !== undefined ? varTestValues[v.name] : (v.default || "");
      });
      const res = await api("/messages/" + cur.id + "/preview-variables", {
        method: "POST",
        body: JSON.stringify({ values: vals }),
      });
      if (res && res.layout) {
        const L = normalize(res.layout);
        const old = cur.layout;
        cur.layout = L;
        $("preview").innerHTML = (isClassicMain() ? renderClassicPreview() : activeBlocks().map(renderBlock).join(""));
        cur.layout = old;
        toast("Server variable preview applied.");
      }
    } catch (err) {
      if (err.message !== "login") notifyErr("Server preview failed: " + err.message);
    }
  }
});

$("rawJsonBtn").onclick = () => {
  closeMore();
  $("rawJsonErr").textContent = "";
  $("rawJsonArea").value = JSON.stringify(cur.layout, null, 2);
  $("rawJsonOverlay").classList.remove("hidden");
};
$("rawJsonClose").onclick = () => { $("rawJsonOverlay").classList.add("hidden"); };
$("rawJsonOverlay").onclick = (e) => { if (e.target === $("rawJsonOverlay")) $("rawJsonOverlay").classList.add("hidden"); };
$("rawJsonCopy").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("rawJsonArea").value);
    notify("Copied JSON to clipboard.", "ok");
  } catch (e) { notifyErr("Could not copy to clipboard."); }
};
$("rawJsonApply").onclick = () => {
  $("rawJsonErr").textContent = "";
  let parsed;
  try { parsed = JSON.parse($("rawJsonArea").value); }
  catch (err) { $("rawJsonErr").textContent = "Invalid JSON: " + err.message; return; }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    $("rawJsonErr").textContent = "Root value must be a JSON object.";
    return;
  }
  const keepGuild = cur.layout.guild_id;
  cur.layout = normalize(parsed);
  if (!cur.layout.guild_id && keepGuild) cur.layout.guild_id = keepGuild;
  selId = null;
  if (tab !== "main" && tab !== "__vars" && !activeReply() && !activeForm() && !activePage()) tab = "main";
  markDirty();
  renderAll();
  $("rawJsonOverlay").classList.add("hidden");
  notify("Applied raw JSON.", "ok");
};
const STARTER_TEMPLATES = [
  {
    name: "Server Rules",
    desc: "Clean rules card with an Accept Rules button.",
    build: () => ({
      blocks: [
        { id: uid(), type: "box", accent: "#5865F2", children: [
          { id: uid(), type: "text", content: "# Server Rules\n1. Be respectful to everyone.\n2. No spam or self-promotion.\n3. Follow Discord's Terms of Service." },
          { id: uid(), type: "divider", spacing: "small", line: true },
          { id: uid(), type: "button_row", buttons: [{ id: uid(), label: "I agree", style: "green", action: { type: "reply", reply_id: "r_rules" }, allowed_roles: [], cooldown: 0, once: false }] }
        ]}
      ],
      replies: [{ id: "r_rules", name: "Agreed", blocks: [{ id: uid(), type: "box", accent: "#57F287", children: [{ id: uid(), type: "text", content: "Thanks {{usermention}}, you're all set!" }] }] }],
      forms: [], variables: [], pages: []
    })
  },
  {
    name: "Welcome Message",
    desc: "Greeting card with server name and member count.",
    build: () => ({
      blocks: [
        { id: uid(), type: "box", accent: "#57F287", children: [
          { id: uid(), type: "text", content: "# Welcome to {{servername}}!\nWe now have **{{membercount}}** members. Check out the rules and say hi!" }
        ]}
      ],
      replies: [], forms: [], variables: [], pages: []
    })
  },
  {
    name: "FAQ",
    desc: "Multi-page FAQ using Pages + Next/Prev buttons.",
    build: () => ({
      blocks: [
        { id: uid(), type: "box", accent: "#1ABC9C", children: [
          { id: uid(), type: "text", content: "# FAQ — Page 1\n**Q: How do I get roles?**\nUse the self-role buttons in #roles." },
          { id: uid(), type: "button_row", buttons: [
            { id: uid(), label: "Prev", style: "grey", action: { type: "page", page_index: -1 }, allowed_roles: [], cooldown: 0, once: false },
            { id: uid(), label: "Next", style: "blue", action: { type: "page", page_index: -2 }, allowed_roles: [], cooldown: 0, once: false }
          ]}
        ]}
      ],
      pages: [
        { id: uid(), name: "Page 2", blocks: [{ id: uid(), type: "box", accent: "#1ABC9C", children: [{ id: uid(), type: "text", content: "# FAQ — Page 2\n**Q: How do I contact staff?**\nClick the Support Info button or message a moderator." }] }], content: "", embeds: [] }
      ],
      replies: [], forms: [], variables: []
    })
  },
  {
    name: "Announcement",
    desc: "Template with {{event_title}} and {{event_date}} variables.",
    build: () => ({
      blocks: [
        { id: uid(), type: "box", accent: "#FEE75C", children: [
          { id: uid(), type: "text", content: "# {{event_title}}\nHappening on **{{event_date}}** in {{servername}}!" }
        ]}
      ],
      variables: [
        { id: uid(), name: "event_title", default: "Community Event" },
        { id: uid(), name: "event_date", default: "This Friday at 8 PM" }
      ],
      replies: [], forms: [], pages: []
    })
  },
  {
    name: "Self-Roles",
    desc: "Pick your roles with buttons.",
    build: () => ({
      blocks: [
        { id: uid(), type: "box", accent: "#EB459E", children: [
          { id: uid(), type: "text", content: "# Pick Your Roles\nClick a button below to toggle a role." },
          { id: uid(), type: "button_row", buttons: [{ id: uid(), label: "Announcements Ping", style: "blue", action: { type: "role", mode: "toggle", role_id: "" }, allowed_roles: [], cooldown: 0, once: false }] }
        ]}
      ],
      replies: [], forms: [], variables: [], pages: []
    })
  },
  {
    name: "Support Info",
    desc: "Helpful info card with a pop-up feedback form.",
    build: () => ({
      blocks: [
        { id: uid(), type: "box", accent: "#E67E22", children: [
          { id: uid(), type: "text", content: "# Need Help?\nClick below to send a message to the team." },
          { id: uid(), type: "button_row", buttons: [{ id: uid(), label: "Open Form", style: "blue", action: { type: "form", form_id: "f_help" }, allowed_roles: [], cooldown: 0, once: false }] }
        ]}
      ],
      forms: [{ id: "f_help", name: "Help Form", title: "Contact Staff", channel_id: "", thanks: "Thanks! Staff will review your message.", fields: [{ id: uid(), label: "How can we help?", style: "paragraph", placeholder: "Describe your question...", required: true }] }],
      replies: [], variables: [], pages: []
    })
  }
];

$("newGalleryBtn").onclick = () => {
  closeNewMenu();
  $("galleryGrid").innerHTML = STARTER_TEMPLATES.map((t, i) =>
    '<div class="galcard"><b>' + esc(t.name) + '</b><p class="muted" style="margin:0;flex:1">' + esc(t.desc) + '</p>' +
    '<button type="button" class="primary small" data-gal="' + i + '">Use template</button></div>'
  ).join("");
  $("galleryOverlay").classList.remove("hidden");
};
$("galleryClose").onclick = () => { $("galleryOverlay").classList.add("hidden"); };
$("galleryOverlay").onclick = (e) => { if (e.target === $("galleryOverlay")) $("galleryOverlay").classList.add("hidden"); };
$("galleryGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-gal]");
  if (!b) return;
  const tpl = STARTER_TEMPLATES[Number(b.dataset.gal)];
  if (!tpl) return;
  $("galleryOverlay").classList.add("hidden");
  openBuilder({ id: null, name: tpl.name, layout: tpl.build() });
});

$("helpBtn").onclick = () => { $("helpOverlay").classList.remove("hidden"); };
$("helpClose").onclick = () => { $("helpOverlay").classList.add("hidden"); };
$("helpOverlay").onclick = (e) => { if (e.target === $("helpOverlay")) $("helpOverlay").classList.add("hidden"); };
start();