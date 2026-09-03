import { AppError } from "../../errors/app-error.js";
import type { CreateCandidateInput,UpdateCandidateInput } from "./candidate.schema.js";
import { candidateRepository, type CandidateQueryFilter, type FindManyOptions } from "./candidate.repository.js";

class CandidateService{
    async createCandidate(input:CreateCandidateInput){
        const existingCandidate = await candidateRepository.findByEmail(input.email)
        if(existingCandidate){
            throw new AppError("A Candidate with this Email already exists",409)
        }
        return candidateRepository.create({
            ...input,
            email:input.email.trim().toLowerCase(),
            skills:this.normalizeSkills(input.skills)
        })
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