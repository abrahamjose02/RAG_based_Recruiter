import type { CreateCandidateInput } from "../candidate/candidate.schema";
import type { ParsedResumeResult } from "./resume.types";

export function mapParsedResumeToCandidateInput(parsed:ParsedResumeResult):CreateCandidateInput | null {
    // const email = parsed.email?.trim().toLowerCase();
    // const name = parsed.name?.trim()
    return {
        name:parsed.name.trim(),
        email:parsed.email.trim(),
        phone:parsed.phone,
        location: parsed.location,
        skills: parsed.skills ?? [],
        totalExperienceYears: parsed.totalExperienceYears ?? 0,
        currentRole: parsed.currentRole,
        professionalSummary: parsed.professionalSummary,
        experience:(parsed.experience ?? []).map((item)=>({
            company:item.company,
            role:item.role,
            startDate:item.startDate ? new Date(item.startDate) : undefined,
            endDate:item.endDate ? new Date(item.endDate): undefined,
            isCurrent:item.isCurrent ?? false,
            description:item.description
        })),
        education:parsed.education ?? []
    }
}