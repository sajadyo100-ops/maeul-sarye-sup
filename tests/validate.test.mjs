import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateCase } from "../tools/validate-cases.mjs";

const good = {
  id: "x-1", region: "가구", regionType: "특별·광역시 자치구", title: "사업", fields: ["안전"],
  year: 2025, budget: null, summary: "요약", awardSource: "행정안전부", url: "https://example.go.kr/a",
  status: "확인 완료", checkedDate: "2026. 11. 25.", addedMonth: null,
};
const bad = (patch) => validateCase({ ...good, ...patch });

test("정상 사례는 문제 없음", () => assert.deepEqual(validateCase(good), []));
test("url 없음", () => assert.ok(bad({ url: "" }).length > 0));
test("url이 https가 아님", () => assert.ok(bad({ url: "http://a.kr" }).length > 0));
test("분야 목록 밖 값", () => assert.ok(bad({ fields: ["교통"] }).length > 0));
test("분야 비어 있음", () => assert.ok(bad({ fields: [] }).length > 0));
test("지역 유형 목록 밖 값", () => assert.ok(bad({ regionType: "도" }).length > 0));
test("상태 값 이상", () => assert.ok(bad({ status: "완료" }).length > 0));
test("확인일 형식 이상", () => assert.ok(bad({ checkedDate: "2026-11-25" }).length > 0));
for (const k of ["id", "region", "title", "summary", "awardSource", "year"]) {
  test(`필수값 ${k} 빈칸`, () => assert.ok(bad({ [k]: "" }).length > 0));
}
test("요약에 전화번호 의심", () => assert.ok(bad({ summary: "문의 010-1234-5678" }).length > 0));
test("요약에 '전화' 포함", () => assert.ok(bad({ summary: "전화로 신청" }).length > 0));

function runCli(data) {
  const dir = mkdtempSync(join(tmpdir(), "cases-"));
  const f = join(dir, "cases.json");
  writeFileSync(f, JSON.stringify(data));
  try {
    return { code: 0, out: execFileSync("node", ["tools/validate-cases.mjs", f], { encoding: "utf8" }) };
  } catch (e) {
    return { code: e.status, out: e.stdout };
  }
}

test("CLI: 정상이면 OK n건", () => {
  const r = runCli({ updated: "2026. 11. 25.", cases: [good] });
  assert.equal(r.code, 0);
  assert.match(r.out, /OK 1건/);
});

test("CLI: 같은 id 두 번이면 실패", () => {
  const r = runCli({ updated: "2026. 11. 25.", cases: [good, good] });
  assert.equal(r.code, 1);
  assert.match(r.out, /x-1/);
});
