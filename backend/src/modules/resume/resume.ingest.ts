import { parseResumeText } from "../../services/python-ai.client";
import { logger } from "../../utils/logger";
import { candidateRepository } from "../candidate/candidate.repository";
import { candidateService } from "../candidate/candidate.service";
import { mapParsedResumeToCandidateInput } from "./resume.mapper";
import { ResumeDocument } from "./resume.model";
import { resumeRepository } from "./resume.repository";

export async function ingestResume(resume:ResumeDocument):Promise<void>{
    const resumeId = resume._id.toString()

    try {
        await resumeRepository.updateStatus(resumeId,"processing")

        const parsed = await parseResumeText(resume.extractedText);

        await resumeRepository.updateStatus(resumeId,"parsed",{
            parsed,
            errorMessage:null
        })

        if(resume.candidateId){
            await candidateRepository.addSourceResumeId(resume.candidateId.toString(),resumeId)
            return;
        }

        const candidateInput = mapParsedResumeToCandidateInput(parsed)
        if(!candidateInput){
            logger.warn("Parsed resume has no name/email; skipping candidate create",{
                resumeId
            })
            return;
        }

        const candidate = await candidateService.upsertFromParsedResume({input:candidateInput,resumeId})

        if(!candidate){
            throw new Error("Candidate upsert returned empty result")
        }
        await resumeRepository.attachCandidate(resumeId,candidate._id.toString())
    } catch (error) {
        logger.error("Resume ingest failed", { resumeId, error });
        await resumeRepository.updateStatus(resumeId, "failed", {
            errorMessage: error instanceof Error ? error.message : "Unknown ingest error",
        });
    }
}

export function scheduleResumeIngest(resume:ResumeDocument):void{
    void ingestResume(resume)
}