import { indexResume } from "../../ai/services/indexing";
import { parseResumeText } from "../../ai/services/resumeParser";
import { candidateRepository } from "../candidate/candidate.repository";
import { candidateService } from "../candidate/candidate.service";
import { hasCandidateIdentity, mapParsedResumeToCandidateInput } from "./resume.mapper";
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

        let candidateId = resume.candidateId?.toString();

        if (candidateId) {
            await candidateRepository.addSourceResumeId(candidateId, resumeId);
        } else if (hasCandidateIdentity(parsed)) {
            const candidateInput = mapParsedResumeToCandidateInput(parsed);
            const candidate = await candidateService.upsertFromParsedResume({
                input: candidateInput,
                resumeId,
            });

            if (!candidate) {
                throw new Error("Candidate upsert returned empty result");
            }

            candidateId = candidate._id.toString();
            await resumeRepository.attachCandidate(resumeId, candidateId);
        } else {
            return;
        }

        await resumeRepository.updateStatus(resumeId, "indexing");

        const { indexedChunks } = await indexResume({
            candidateId,
            resumeId,
            parsed,
            ...(resume.recruiterId
                ? { recruiterId: resume.recruiterId.toString() }
                : {}),
        });

        await resumeRepository.updateStatus(resumeId, "ready", {
            indexedChunks,
            errorMessage: null,
        });
    } catch (error) {
        await resumeRepository.updateStatus(resumeId, "failed", {
            errorMessage: error instanceof Error ? error.message : "Unknown ingest error",
        });
    }
}

export function scheduleResumeIngest(resume: ResumeDocument): void {
    void ingestResume(resume);
}
