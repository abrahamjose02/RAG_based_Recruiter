import { randomUUID } from "node:crypto";
import { env } from "../../config/env";
import type { ParsedResumeResultInput } from "../../modules/resume/resume.schema";
import { embedMany } from "../providers/embeddings";
import { vectorRepository } from "../repositories/vector.repositories";
import type { VectorPoint } from "../types";
import { chunkParsedResume } from "./chunking";

function lower(values: string[]): string[] {
    return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

export async function indexResume(params: {
    resumeId: string;
    parsed: ParsedResumeResultInput;
    recruiterId?: string;
}): Promise<{ indexedChunks: number }> {
    const chunks = chunkParsedResume(params.parsed);
    await vectorRepository.deleteByResumeId(params.resumeId);
    if (chunks.length === 0) return { indexedChunks: 0 };

    const vectors = await embedMany(chunks.map((chunk) => chunk.text));
    const companies = lower(params.parsed.experience.map((item) => item.company));
    const points: VectorPoint[] = chunks.map((chunk, index) => ({
        id: randomUUID(),
        vector: vectors[index] ?? [],
        payload: {
            source: "resume",
            candidate_profile_id: params.resumeId,
            resume_id: params.resumeId,
            chunk_type: chunk.chunkType,
            text: chunk.text,
            ...(params.parsed.location?.city
                ? { city: params.parsed.location.city.trim().toLowerCase() }
                : {}),
            ...(params.parsed.totalExperienceYears != null
                ? { total_experience_years: params.parsed.totalExperienceYears }
                : {}),
            skills: lower(params.parsed.skills),
            ...(params.parsed.currentRole
                ? { current_role: params.parsed.currentRole.trim().toLowerCase() }
                : {}),
            companies,
            embedding_version: env.EMBEDDING_VERSION,
            ...(params.recruiterId
                ? { uploaded_by_recruiter_id: params.recruiterId }
                : {}),
        },
    }));

    await vectorRepository.upsert(points.filter((point) => point.vector.length > 0));
    return { indexedChunks: points.length };
}