import type { ParsedResumeResultInput } from "../../modules/resume/resume.schema";
import type { ResumeChunk } from "../types";

function clean(value: string | undefined): string {
    return value?.trim() ?? "";
}

export function chunkParsedResume(parsed: ParsedResumeResultInput): ResumeChunk[] {
    const chunks: ResumeChunk[] = [];
    const location = [parsed.location?.city, parsed.location?.state, parsed.location?.country]
        .filter(Boolean)
        .join(", ");
    const summary = [
        clean(parsed.name),
        clean(parsed.email),
        clean(parsed.phone),
        clean(parsed.currentRole),
        parsed.totalExperienceYears != null ? `${parsed.totalExperienceYears} years` : "",
        location,
        clean(parsed.professionalSummary),
    ].filter(Boolean).join("\n");

    if (summary) {
        chunks.push({ chunkType: "PROFILE_SUMMARY", text: summary });
    }
    if (parsed.skills.length > 0) {
        chunks.push({ chunkType: "SKILLS", text: parsed.skills.join(", ") });
    }

    parsed.experience.forEach((item, index) => {
        const text = [
            item.role,
            item.company,
            [item.startDate, item.endDate].filter(Boolean).join(" - "),
            clean(item.description),
        ].filter(Boolean).join("\n");
        if (text) chunks.push({ chunkType: `EXPERIENCE_${index}`, text });
    });

    parsed.education.forEach((item, index) => {
        const text = [item.degree, item.fieldOfStudy, item.institution]
            .map(clean)
            .filter(Boolean)
            .join(", ");
        if (text) chunks.push({ chunkType: `EDUCATION_${index}`, text });
    });

    return chunks;
}