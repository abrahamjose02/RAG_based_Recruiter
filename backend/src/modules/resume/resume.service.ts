import { AppError } from "../../errors/app-error";
import { candidateRepository } from "../candidate/candidate.repository";
import { scheduleResumeIngest } from "./resume.ingest";
import { resumeRepository, type ResumeQueryFilter, type FindManyResumesOptions, CreateResumeRecordInput } from "./resume.repository";

function assertStorageKeyBelongsToOrganization(documents:CreateResumeRecordInput["documents"],organizationId:string):void{
    const prefix = `organizations/${organizationId}/resumes/`;

    for(const document of documents){
        if(!document.storage.key.toLowerCase().startsWith(prefix.toLowerCase())){
            throw new AppError("Resume storage key does not belong to this organization", 400);
        }
    }
}

class ResumeService {
    async createResume(input: CreateResumeRecordInput) {
        assertStorageKeyBelongsToOrganization(input.documents,input.organizationId)
        if (input.candidateId) {
            const candidate = await candidateRepository.findById(input.candidateId);

            if (!candidate) {
                throw new AppError("Candidate not found", 404);
            }
        }

        const resumes = await resumeRepository.createMany(input);

        for(const resume of resumes){
            scheduleResumeIngest(resume)
        }

        return resumes
    }

    async getResumes(filter: ResumeQueryFilter, options: FindManyResumesOptions = {}) {
        return resumeRepository.findMany(filter, options);
    }

    async getResumeById(id: string) {
        const resume = await resumeRepository.findById(id);

        if (!resume) {
            throw new AppError("Resume not found", 404);
        }

        return resume;
    }
}

export const resumeService = new ResumeService();
