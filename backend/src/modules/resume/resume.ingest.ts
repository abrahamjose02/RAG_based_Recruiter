import { indexResume } from "../../ai/services/indexing";
import { parseResumeText } from "../../ai/services/resumeParser";
import { ResumeDocument } from "./resume.model";
import { resumeRepository } from "./resume.repository";

export async function ingestResume(resume: ResumeDocument): Promise<void> {
    const resumeId = resume._id.toString();

    try {
        await resumeRepository.updateStatus(resumeId, "processing");
        const parsed = await parseResumeText(resume.extractedText);
        await resumeRepository.updateStatus(resumeId, "parsed", {
            parsed,
            errorMessage: null,
        });

        await resumeRepository.updateStatus(resumeId, "indexing");
        const { indexedChunks } = await indexResume({
            resumeId,
            parsed,
            ...(resume.recruiterId
                ? { recruiterId: resume.recruiterId.toString() }
                : {}),
        });

        await resumeRepository.updateStatus(
            resumeId,
            indexedChunks > 0 ? "ready" : "parsed",
            { indexedChunks, errorMessage: null },
        );
    } catch (error) {
        await resumeRepository.updateStatus(resumeId, "failed", {
            errorMessage: error instanceof Error ? error.message : "Unknown ingest error",
        });
    }
}

export function scheduleResumeIngest(resume: ResumeDocument): void {
    void ingestResume(resume);
}