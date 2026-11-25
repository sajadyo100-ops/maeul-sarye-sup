// 검색·거르기 로직 (화면과 분리된 순수 함수)

export const FIELDS = ["안전", "환경", "어르신", "아이·청소년", "청년", "복지·돌봄", "골목·주거", "문화·축제", "제도 운영"];
export const REGION_TYPES = ["광역 시·도", "특별·광역시 자치구", "시", "군"];

export function normalize(text) {
  return String(text ?? "").toLowerCase().replace(/\s+/g, "");
}

export function publicCases(cases) {
  return cases
    .filter((c) => c.status === "확인 완료")
    .sort((a, b) => (b.year - a.year) || a.region.localeCompare(b.region, "ko"));
}

export function searchCases(cases, { query = "", field = "전체", regionType = "전체" } = {}) {
  const q = normalize(query);
  return publicCases(cases).filter((c) =>
    (!q || [c.title, c.summary, c.region].some((t) => normalize(t).includes(q))) &&
    (field === "전체" || (c.fields || []).includes(field)) &&
    (regionType === "전체" || c.regionType === regionType)
  );
}

export function newCases(cases, today) {
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  return publicCases(cases).filter((c) => c.addedMonth === month);
}

export function formatBudget(budget) {
  return budget ? budget : "확인되지 않음";
}
