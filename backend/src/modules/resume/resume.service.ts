import { AppError } from "../../errors/app-error";
import { candidateRepository } from "../candidate/candidate.repository";
import { resumeRepository, type ResumeQueryFilter, type FindManyResumesOptions } from "./resume.repository";
import type { UploadResumeInput } from "./resume.schema";

class ResumeService {
    async createResume(input: UploadResumeInput) {
        if (input.candidateId) {
            const candidate = await candidateRepository.findById(input.candidateId);

            if (!candidate) {
                throw new AppError("Candidate not found", 404);
            }
        }

        return resumeRepository.createMany(input);
    }

    async getResumes(filter: ResumeQueryFilter = {}, options: FindManyResumesOptions = {}) {
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
