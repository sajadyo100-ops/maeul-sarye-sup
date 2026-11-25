import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderCard, renderResults, renderNew, renderLoadError, renderRegionChecks } from "../js/app.js";

const c = {
  id: "a", region: "가구", regionType: "특별·광역시 자치구", title: "골목길 조명", fields: ["안전"],
  year: 2025, budget: null, summary: "요약 & 내용", awardSource: "행정안전부 사례집",
  url: "https://example.go.kr/a", status: "확인 완료", checkedDate: "2026. 11. 25.", addedMonth: null,
};

test("escapeHtml: 특수문자를 글자로 바꿈", () => {
  assert.equal(escapeHtml("<b>&"), "&lt;b&gt;&amp;");
  assert.equal(escapeHtml('"\''), "&quot;&#39;");
});

test("renderCard: 데이터 속 태그가 실행되지 않음", () => {
  const html = renderCard({ ...c, title: "<script>alert(1)</script>" });
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("renderCard: 필요한 정보와 안전한 원문 링크 포함", () => {
  const html = renderCard(c);
  for (const s of ["가구 · 2025 선정", "골목길 조명", "확인되지 않음", "행정안전부 사례집", "2026. 11. 25.",
    'href="https://example.go.kr/a"', 'target="_blank"', 'rel="noopener"', "원문 보기"]) {
    assert.ok(html.includes(s), s);
  }
});

test("renderResults: 0건이면 안내 문구", () => {
  assert.ok(renderResults([]).includes("찾는 사례가 없어요. 다른 낱말로 검색해 보세요."));
});

test("renderResults: 사례 수만큼 카드", () => {
  const html = renderResults([c, { ...c, id: "b" }]);
  assert.equal(html.split('class="case-card"').length - 1, 2);
});

test("renderNew: 0건이면 빈 문자열, 1건이면 NEW", () => {
  assert.equal(renderNew([]), "");
  assert.ok(renderNew([c]).includes("NEW"));
});

test("renderRegionChecks: 지역 유형마다 체크박스, 고른 것만 체크됨", () => {
  const html = renderRegionChecks(["시"]);
  assert.equal(html.split('type="checkbox"').length - 1, 4);
  assert.match(html, /value="시" checked/);
  assert.doesNotMatch(html, /value="군" checked/);
});

test("renderLoadError: 불러오기 실패 문구", () => {
  assert.ok(renderLoadError().includes("사례를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요."));
});
