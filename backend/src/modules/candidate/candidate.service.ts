import { AppError } from "../../errors/app-error";
import type { CreateCandidateInput,UpdateCandidateInput } from "./candidate.schema";
import { candidateRepository, PersistCandidateInput, type CandidateQueryFilter, type FindManyOptions } from "./candidate.repository";

class CandidateService{
    async createCandidate(input:CreateCandidateInput){
        const existingCandidate = await candidateRepository.findByEmail(input.email)
        if(existingCandidate){
            throw new AppError("A Candidate with this Email already exists",409)
        }
        return candidateRepository.create({
            ...input,
            email:input.email.trim().toLowerCase(),
            skills:this.normalizeSkills(input.skills),
            source:"manual"
        })
    }

    async upsertFromParsedResume(params:{input:CreateCandidateInput;resumeId:string;}){
        const email = params.input.email.trim().toLowerCase();
        const existing = await candidateRepository.findByEmail(email);
        if(!existing){
            return candidateRepository.create({
                ...params.input,
                email,
                skills:this.normalizeSkills(params.input.skills),
                source:"resume_upload",
                sourceResumeIds:[params.resumeId]
            })
        }
        await candidateRepository.updateById(existing._id.toString(),{
            name:params.input.name,
            phone:params.input.phone,
            location:params.input.location,
            skills:this.normalizeSkills(params.input.skills),
            totalExperienceYears:params.input.totalExperienceYears,
            currentRole:params.input.currentRole,
            professionalSummary:params.input.professionalSummary,
            experience:params.input.experience,
            education:params.input.education
        })
        return candidateRepository.addSourceResumeId(existing._id.toString(),params.resumeId)
    }

    async getCandidates(filter:CandidateQueryFilter={},options:FindManyOptions={}){
        return candidateRepository.findMany(filter,options)
    }

    async getCandidateById(id:string){
        const candidate = await candidateRepository.findById(id)

        if(!candidate){
            throw new AppError("Candidate not found",404)
        }
        return candidate
    }

    async updateCandidate(id:string,input:UpdateCandidateInput){
        if(input.email){
            const candidateEmail = await candidateRepository.findByEmail(input.email);
            if(candidateEmail && candidateEmail._id.toString() !== id){
                throw new AppError("A Candidate with this email already exists",409)
            }
        }

        const candidate = await candidateRepository.updateById(id,{
            ...input,
            ...(input.email
                ?{email:input.email.trim().toLowerCase()}:{}
            ),
            ...(input.skills 
                ?{skills:this.normalizeSkills(input.skills)}:
                {}
            )
        })
        if(!candidate){
            throw new AppError("Candidate not found",404);
        }
        return candidate
    }

    async deleteCandidate(id:string){
        const candidate = await candidateRepository.deleteById(id)
        
    if (!candidate) {
        throw new AppError("Candidate not found", 404);
      }
      return candidate;
    }

    private normalizeSkills(skills:string[]):string[]{
        const seen = new Set<string>();
        const result:string[] = [];
        for(const skill of skills){
            const normalized = skill.trim();
            if(!normalized) continue;

            const key = normalized.toLowerCase()
            if(seen.has(key)){
                continue
            }
            seen.add(key)
            result.push(normalized)
        }
        return result
    }
    }
    export const candidateService = new CandidateService();