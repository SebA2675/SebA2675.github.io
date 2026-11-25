const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const emojiUrl = (e) => "https://cdn.discordapp.com/emojis/" + encodeURIComponent(e.id) + "." + (e.animated ? "gif" : "png");

function inline(s) {
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
  return String(text || "").split("\n").map((line) => {
    if (line.startsWith("### ")) return "<h3>" + inline(line.slice(4)) + "</h3>";
    if (line.startsWith("## ")) return "<h2>" + inline(line.slice(3)) + "</h2>";
    if (line.startsWith("# ")) return "<h1>" + inline(line.slice(2)) + "</h1>";
    if (line.startsWith("-# ")) return '<p class="dm" style="font-size:12px">' + inline(line.slice(3)) + "</p>";
    if (line.startsWith("- ")) return "<p>&bull; " + inline(line.slice(2)) + "</p>";
    return "<p>" + (inline(line) || "&nbsp;") + "</p>";
  }).join("");
}

function renderBtn(x) {
  const link = x.action && x.action.type === "link";
  return '<span class="pbtn ' + (link ? "" : esc(x.style || "grey")) + '">' +
    (x.emoji ? '<img class="emoji" src="' + emojiUrl(x.emoji) + '" alt="">' : "") +
    esc(x.label || "") + (link ? " &#8599;" : "") + "</span>";
}

function renderBlocks(blocks) {
  return (blocks || []).map((b) => {
    if (b.type === "text") return '<div class="ptext">' + md(b.content) + "</div>";
    if (b.type === "section") {
      const side = b.side === "thumbnail"
        ? (String(b.image || "").trim().startsWith("https://") ? '<img class="pthumb" src="' + esc(b.image.trim()) + '" alt="">' : '<div class="pthumb ph"></div>')
        : renderBtn(b.button || {});
      return '<div class="psec"><div class="psec-text ptext">' + md(b.content) + '</div><div class="psec-side">' + side + "</div></div>";
    }
    if (b.type === "divider") return '<div class="pdiv ' + (b.line ? "line " : "") + (b.spacing === "large" ? "large" : "") + '"></div>';
    if (b.type === "box") {
      const c = /^#[0-9a-f]{6}$/i.test(b.accent) ? b.accent : "#5865F2";
      return '<div class="pbox" style="border-left-color:' + c + '">' + renderBlocks(b.children) + "</div>";
    }
    if (b.type === "button_row") return '<div class="pbtns">' + (b.buttons || []).map(renderBtn).join("") + "</div>";
    if (b.type === "dropdown") return '<div class="psel"><span>' + esc(b.placeholder || "Choose an option...") + "</span><span>&#9662;</span></div>";
    if (b.type === "images") {
      const u = (b.urls || []).filter((x) => String(x).trim().startsWith("https://"));
      if (!u.length) return "";
      const cols = u.length === 1 ? 1 : 2;
      return '<div class="pimgs" style="grid-template-columns:repeat(' + cols + ',1fr)">' + u.map((x) => '<img src="' + esc(x.trim()) + '" alt="">').join("") + "</div>";
    }
    return "";
  }).join("");
}

function renderEmbed(e) {
  const s = (u) => String(u || "").trim();
  const ok = (u) => s(u).startsWith("https://");
  const c = /^#[0-9a-f]{6}$/i.test(e.color) ? e.color : "#5865F2";
  let h = '<div class="cembed" style="border-left-color:' + c + '"><div class="ctop"><div class="cmain">';
  if (e.author_name) h += '<div class="cauthor">' + (ok(e.author_icon) ? '<img src="' + esc(s(e.author_icon)) + '" alt="">' : "") + "<span>" + esc(e.author_name) + "</span></div>";
  if (e.title) h += '<div class="ctitle">' + (ok(e.url) ? '<a href="' + esc(s(e.url)) + '" target="_blank" rel="noopener">' + esc(e.title) + "</a>" : esc(e.title)) + "</div>";
  if (e.description) h += '<div class="cdesc ptext">' + md(e.description) + "</div>";
  if (e.fields && e.fields.length) {
    h += '<div class="cfields">' + e.fields.map((f) => '<div class="cfield' + (f.inline ? " inline" : "") + '"><div class="cfname">' + esc(f.name) + '</div><div class="cfval">' + inline(f.value) + "</div></div>").join("") + "</div>";
  }
  h += "</div>" + (ok(e.thumbnail) ? '<img class="cthumb" src="' + esc(s(e.thumbnail)) + '" alt="">' : "") + "</div>";
  if (ok(e.image)) h += '<img class="cimg" src="' + esc(s(e.image)) + '" alt="">';
  if (e.footer_text || e.timestamp) {
    h += '<div class="cfoot">' + (e.footer_text && ok(e.footer_icon) ? '<img src="' + esc(s(e.footer_icon)) + '" alt="">' : "") + "<span>" + esc(e.footer_text || "") + "</span></div>";
  }
  return h + "</div>";
}

async function load() {
  const tok = new URLSearchParams(location.search).get("t") || "";
  if (!tok) { $("shSub").textContent = "Missing share token."; return; }
  try {
    const res = await fetch(API_URL + "/share/" + encodeURIComponent(tok));
    if (!res.ok) throw new Error("Share link expired or not found");
    const d = await res.json();
    $("shTitle").textContent = d.name || "Shared Draft";
    $("shSub").textContent = "Read-only preview (expires " + new Date(d.expires_at * 1000).toLocaleDateString() + ")";
    const L = d.layout || {};
    if (L.kind === "classic") {
      $("shPreview").innerHTML = (L.content ? '<div class="ptext cmsg">' + md(L.content) + "</div>" : "") +
        (L.embeds || []).map(renderEmbed).join("") + renderBlocks(L.blocks);
    } else {
      $("shPreview").innerHTML = renderBlocks(L.blocks);
    }
  } catch (e) {
    $("shSub").textContent = e.message;
  }
}
load();