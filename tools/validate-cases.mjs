// 사례 데이터 점검 도구
// 사용: node tools/validate-cases.mjs data/cases.json
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FIELDS, REGION_TYPES } from "../js/search.js";

const REQUIRED = ["id", "region", "title", "summary", "awardSource", "year"];
const STATUSES = ["확인 완료", "확인 전"];
const DATE_RE = /^\d{4}\. \d{1,2}\. \d{1,2}\.$/;
const PRIVACY_RE = /전화|01[016789]-?\d{3,4}-?\d{4}/;

export function validateCase(c) {
  const p = [];
  for (const k of REQUIRED) if (c[k] === undefined || c[k] === null || c[k] === "") p.push(`${k} 빈칸`);
  if (!c.url) p.push("url 없음");
  else if (!String(c.url).startsWith("https://")) p.push("url이 https://로 시작하지 않음");
  if (!Array.isArray(c.fields) || c.fields.length === 0) p.push("fields 비어 있음");
  else for (const f of c.fields) if (!FIELDS.includes(f)) p.push(`분야 값 이상: ${f}`);
  if (!REGION_TYPES.includes(c.regionType)) p.push(`지역 유형 값 이상: ${c.regionType}`);
  if (!STATUSES.includes(c.status)) p.push(`상태 값 이상: ${c.status}`);
  if (!DATE_RE.test(c.checkedDate || "")) p.push(`확인일 형식 이상: ${c.checkedDate}`);
  if (PRIVACY_RE.test(c.summary || "")) p.push("요약에 개인정보(전화번호) 의심");
  return p;
}

function main(file) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const lines = [];
  const seen = new Set();
  for (const c of data.cases) {
    if (seen.has(c.id)) lines.push(`${c.id}: id 중복`);
    seen.add(c.id);
    for (const msg of validateCase(c)) lines.push(`${c.id}: ${msg}`);
  }
  if (lines.length) {
    console.log(lines.join("\n"));
    process.exit(1);
  }
  console.log(`OK ${data.cases.length}건`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv[2]);
