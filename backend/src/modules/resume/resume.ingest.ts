import { indexResume, parseResumeText } from "../../services/python-ai.client";
import { candidateRepository } from "../candidate/candidate.repository";
import { candidateService } from "../candidate/candidate.service";
import { mapParsedResumeToCandidateInput } from "./resume.mapper";
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

        let candidateId: string;

        if (resume.candidateId) {
            candidateId = resume.candidateId.toString();
            await candidateRepository.addSourceResumeId(candidateId, resumeId);
        } else {
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
        }

        await resumeRepository.updateStatus(resumeId, "indexing");

        const { indexedChunks } = await indexResume({
            candidateId,
            resumeId,
            extractedText: resume.extractedText,
            parsed,
            ...(resume.organizationId
                ? { sourceOrganizationId: resume.organizationId.toString() }
                : {}),
            ...(resume.recruiterId
                ? { sourceRecruiterId: resume.recruiterId.toString() }
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