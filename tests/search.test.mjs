import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalize, publicCases, searchCases, newCases, formatBudget, FIELDS, REGION_TYPES,
} from "../js/search.js";

const cases = [
  { id: "a", region: "가구", regionType: "광역시 자치구", title: "골목길 조명 개선", summary: "어두운 골목", fields: ["안전", "골목·주거"], year: 2024, status: "확인 완료", addedMonth: null },
  { id: "b", region: "나군", regionType: "군", title: "마을 쓰레기 줄이기", summary: "분리배출", fields: ["환경"], year: 2025, status: "확인 완료", addedMonth: "2026-12" },
  { id: "c", region: "다시", regionType: "시", title: "청소년 쉼터", summary: "방과 후", fields: ["아이·청소년"], year: 2025, status: "확인 완료", addedMonth: null },
  { id: "d", region: "라구", regionType: "광역시 자치구", title: "골목 벽화", summary: "확인 전 후보", fields: ["골목·주거"], year: 2026, status: "확인 전", addedMonth: "2026-12" },
];

test("normalize: 공백 제거와 소문자화", () => {
  assert.equal(normalize("  골목 길 AB "), "골목길ab");
});

test("searchCases: 띄어쓰기가 달라도 같은 결과", () => {
  const ids = searchCases(cases, { query: " 골목 길 " }).map((c) => c.id);
  assert.deepEqual(ids, ["a"]);
});

test("searchCases: 빈 조건이면 확인 완료 사례 전부, 확인 전 제외", () => {
  const r = searchCases(cases, {});
  assert.equal(r.length, 3);
  assert.ok(!r.some((c) => c.status === "확인 전"));
});

test("publicCases: 연도 내림차순, 같은 연도는 지역 가나다순", () => {
  assert.deepEqual(publicCases(cases).map((c) => c.id), ["b", "c", "a"]);
});

test("searchCases: 분야로 거르기", () => {
  assert.deepEqual(searchCases(cases, { field: "환경" }).map((c) => c.id), ["b"]);
});

test("searchCases: 지역 유형으로 거르기", () => {
  assert.deepEqual(searchCases(cases, { regionType: "군" }).map((c) => c.id), ["b"]);
});

test("searchCases: 지역명으로도 찾음", () => {
  assert.deepEqual(searchCases(cases, { query: "다시" }).map((c) => c.id), ["c"]);
});

test("newCases: 이번 달 추가된 확인 완료 사례만", () => {
  assert.deepEqual(newCases(cases, new Date("2026-12-03")).map((c) => c.id), ["b"]);
  assert.deepEqual(newCases(cases, new Date("2027-01-02")), []);
});

test("formatBudget: 없으면 확인되지 않음", () => {
  assert.equal(formatBudget(null), "확인되지 않음");
  assert.equal(formatBudget(""), "확인되지 않음");
  assert.equal(formatBudget("5,000만원"), "5,000만원");
});

test("FIELDS와 REGION_TYPES 값과 순서", () => {
  assert.deepEqual(FIELDS, ["안전", "환경", "어르신", "아이·청소년", "골목·주거", "문화·축제"]);
  assert.deepEqual(REGION_TYPES, ["광역 시·도", "광역시 자치구", "시", "군"]);
});
