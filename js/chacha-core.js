// Shared by the browser (index.html) and Node (api/, tests). No dependencies.

// Case-study ids the model may reference with [[case:<id>]], mapped to CASES indexes in index.html.
export const CASE_IDS = { udo: 0, onboarding: 1, hitl: 2, uda: 3, pm: 4 };

export const FALLBACK_LINE = 'Too many questions today. Cha Cha needs a nap 😴 Try one below, or email Chung-Han at plmaxi@gmail.com.';

const MARKER = /\s*\[\[case:([a-z]*)\]\]/g;
// A marker that has started arriving but is not complete yet, at the very end of the text.
const PARTIAL_MARKER = /\s*\[(\[(c(a(s(e(:[a-z]*)?)?)?)?)?)?$/;

export function parseCaseMarker(text) {
  let caseId = null;
  const clean = text.replace(MARKER, (_, id) => {
    if (caseId === null && Object.hasOwn(CASE_IDS, id)) caseId = id;
    return '';
  });
  return { text: clean.trim(), caseId };
}

export function stripPartialMarker(text) {
  return text.replace(MARKER, '').replace(PARTIAL_MARKER, '').trimEnd();
}
