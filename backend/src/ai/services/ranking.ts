import type { UnderstandingQuery } from "./queryUnderstanding";
import type { VectorSearchHit } from "../types";

export type RankedResume = {
    resumeId: string;
    score: number;
    evidence: string[];
};

function overlap(wanted: string[], owned: string[]): number {
    if (wanted.length === 0) return 1;
    const ownedSet = new Set(owned.map((item) => item.toLowerCase()));
    const hits = wanted.filter((item) => ownedSet.has(item.toLowerCase()));
    return hits.length / wanted.length;
}

function includesText(haystack: string, needle?: string): number {
    if (!needle) return 1;
    return haystack.toLowerCase().includes(needle.toLowerCase()) ? 1 : 0;
}

export function rankResumes(
    hits: VectorSearchHit[],
    understood: UnderstandingQuery,
): RankedResume[] {
    const groups = new Map<string, VectorSearchHit[]>();

    for (const hit of hits) {
        const id = hit.payload.resume_id;
        const group = groups.get(id) ?? [];
        group.push(hit);
        groups.set(id, group);
    }

    const ranked: RankedResume[] = [];

    for (const [resumeId, group] of groups) {
        const best = group.reduce((top, hit) => (hit.score > top.score ? hit : top));
        const skills = best.payload.skills ?? [];
        const companies = (best.payload.companies ?? []).join(" ");
        const role = best.payload.current_role ?? "";
        const years = best.payload.total_experience_years;
        const evidence = [...group]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((hit) => hit.payload.text);

        const experienceFit =
            understood.minExperienceYears == null
                ? 1
                : years != null && years >= understood.minExperienceYears
                    ? 1
                    : 0;

        const score =
            0.3 * best.score +
            0.3 * overlap(understood.skills, skills) +
            0.15 * experienceFit +
            0.1 * includesText(role, understood.currentRole) +
            0.1 * Math.max(
                includesText(companies, understood.companies[0]),
                includesText(`${role} ${evidence.join(" ")}`, understood.domain),
            ) +
            0.05 * overlap(understood.preferredSkills, skills);

        ranked.push({ resumeId, score, evidence });
    }

    return ranked.sort((a, b) => b.score - a.score);
}
