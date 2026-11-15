import raw from "./psi-metadata.json";

export type PsiRecord = {
  psiId: string; acronym: string; appId: string; title: string; ground: boolean; doi: string;
  hardware: string; platform: string; objective: string; hypothesis: string; approach: string; impacts: string;
  keywords: string[]; people: string[]; publications: { title: string; link: string }[];
};

const RECORDS = raw as PsiRecord[];

export function psiFor(appId: string) {
  const all = RECORDS.filter((r) => r.appId === appId);
  return { flight: all.find((r) => !r.ground) ?? null, related: all.filter((r) => r.ground) };
}

export const PSI_COUNT = new Set(RECORDS.filter((r) => !r.ground).map((r) => r.appId)).size;

export const clip = (s: string, n: number) => (s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "…" : s);
