const API_URL = "https://h5nngnplb6.apps.bot-hosting.cloud";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderText(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/\n/g, "<br>");
}

function renderBlocks(blocks) {
  return (blocks || []).map((b) => {
    if (b.type === "text" || b.type === "section") return '<div class="ptext"><p>' + renderText(b.content) + "</p></div>";
    if (b.type === "divider") return '<div class="pdiv ' + (b.line ? "line " : "") + '"></div>';
    if (b.type === "box") return '<div class="pbox" style="border-left-color:' + esc(b.accent || "#5865F2") + '">' + renderBlocks(b.children) + "</div>";
    if (b.type === "button_row") return '<div class="pbtns">' + (b.buttons || []).map((x) => '<span class="pbtn ' + esc(x.style || "grey") + '">' + esc(x.label) + "</span>").join("") + "</div>";
    if (b.type === "dropdown") return '<div class="psel"><span>' + esc(b.placeholder || "Choose...") + "</span><span>&#9662;</span></div>";
    if (b.type === "images") return '<div class="pimgs">' + (b.urls || []).filter((u) => u.startsWith("https://")).map((u) => '<img src="' + esc(u) + '" alt="">').join("") + "</div>";
    return "";
  }).join("");
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
      $("shPreview").innerHTML = (L.content ? '<div class="ptext"><p>' + renderText(L.content) + "</p></div>" : "") +
        (L.embeds || []).map((e) =>
          '<div class="cembed" style="border-left-color:' + esc(e.color || "#5865F2") + '">' +
          (e.title ? '<div class="ctitle">' + esc(e.title) + "</div>" : "") +
          (e.description ? '<div class="cdesc ptext"><p>' + renderText(e.description) + "</p></div>" : "") +
          "</div>"
        ).join("") + renderBlocks(L.blocks);
    } else {
      $("shPreview").innerHTML = renderBlocks(L.blocks);
    }
  } catch (e) {
    $("shSub").textContent = e.message;
  }
}
load();