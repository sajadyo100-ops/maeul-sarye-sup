// 화면 그리기와 이벤트
import { FIELDS, REGION_TYPES, searchCases, newCases, formatBudget } from "./search.js";

const ICONS = { "안전": "🚸", "환경": "🌳", "어르신": "👵", "아이·청소년": "🧒", "골목·주거": "🏘️", "문화·축제": "🎉" };

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

export function renderCard(c) {
  const e = escapeHtml;
  const icon = ICONS[(c.fields || [])[0]] || "🌱";
  return `<article class="case-card">
  <div class="case-icon" aria-hidden="true">${icon}</div>
  <p class="case-region">${e(c.region)} · ${e(c.year)}</p>
  <h3 class="case-title">${e(c.title)}</h3>
  <p class="case-fields">${(c.fields || []).map((f) => `<span>${e(f)}</span>`).join("")}</p>
  <details>
    <summary>자세히 보기</summary>
    <p>${e(c.summary)}</p>
    <dl>
      <dt>예산</dt><dd>${e(formatBudget(c.budget))}</dd>
      <dt>우수사례 출처</dt><dd>${e(c.awardSource)}</dd>
      <dt>확인일</dt><dd>${e(c.checkedDate)}</dd>
    </dl>
    <a class="case-link" href="${e(c.url)}" target="_blank" rel="noopener">원문 보기 ↗</a>
  </details>
</article>`;
}

export function renderResults(list) {
  if (!list.length) return `<p class="empty">찾는 사례가 없어요. 다른 낱말로 검색해 보세요.</p>`;
  return list.map(renderCard).join("\n");
}

export function renderNew(list) {
  if (!list.length) return "";
  return list.slice(0, 3).map((c) => `<div class="new-item">
  <p><b>${escapeHtml(c.region)}</b> <span class="badge">NEW</span></p>
  <p>${escapeHtml(c.title)}</p>
  <p class="muted">${escapeHtml(c.checkedDate)} 확인</p>
</div>`).join("\n");
}

export function renderLoadError() {
  return `<p class="empty">사례를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>`;
}

// ---------- 브라우저에서만 실행 ----------
async function start() {
  const $ = (id) => document.getElementById(id);
  const state = { query: "", field: "전체", regionType: "전체", mode: "field" };
  let cases = [];

  try {
    const res = await fetch("data/cases.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    cases = data.cases;
    $("updated").textContent = `자료 갱신: ${data.updated}`;
  } catch {
    $("results").innerHTML = renderLoadError();
    return;
  }

  const fresh = newCases(cases, new Date());
  $("new-list").innerHTML = renderNew(fresh);
  $("new-section").hidden = fresh.length === 0;

  function drawChips() {
    const items = ["전체", ...(state.mode === "field" ? FIELDS : REGION_TYPES)];
    const current = state.mode === "field" ? state.field : state.regionType;
    $("chips").innerHTML = items.map((v) =>
      `<button type="button" class="chip${v === current ? " on" : ""}" data-v="${escapeHtml(v)}" aria-pressed="${v === current}">${escapeHtml(v)}</button>`).join("");
    $("mode-field").classList.toggle("on", state.mode === "field");
    $("mode-region").classList.toggle("on", state.mode === "region");
  }

  function draw() {
    const list = searchCases(cases, state);
    $("count").textContent = `${list.length}건`;
    $("results").innerHTML = renderResults(list);
    $("results").scrollLeft = 0;
  }

  $("search").addEventListener("input", (ev) => { state.query = ev.target.value; draw(); });
  $("search-form").addEventListener("submit", (ev) => { ev.preventDefault(); draw(); $("cases").scrollIntoView({ behavior: "smooth" }); });
  $("mode-field").addEventListener("click", () => { state.mode = "field"; state.regionType = "전체"; drawChips(); draw(); });
  $("mode-region").addEventListener("click", () => { state.mode = "region"; state.field = "전체"; drawChips(); draw(); });
  $("chips").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-v]");
    if (!b) return;
    if (state.mode === "field") state.field = b.dataset.v; else state.regionType = b.dataset.v;
    drawChips(); draw();
  });
  const step = () => Math.max(260, $("results").clientWidth * 0.8);
  $("prev").addEventListener("click", () => $("results").scrollBy({ left: -step(), behavior: "smooth" }));
  $("next").addEventListener("click", () => $("results").scrollBy({ left: step(), behavior: "smooth" }));

  drawChips();
  draw();
}

if (typeof document !== "undefined") start();
