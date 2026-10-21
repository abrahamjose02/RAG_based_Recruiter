import { embedMany } from "../../ai/providers/embeddings";
import { writeGroundedAnswer } from "../../ai/services/groundedAnswer";
import { understandQuery } from "../../ai/services/queryUnderstanding";
import { rankResumes } from "../../ai/services/ranking";
import { vectorRepository } from "../../ai/repositories/vector.repositories";
import { resumeRepository } from "../resume/resume.repository";
import type { RecruiterSearchInput } from "./search.schema";
import type { PublicResumeView } from "./search.types";

const RESULT_LIMIT = 5;
const CHUNK_LIMIT = 50;

class SearchService{
    async search(input:RecruiterSearchInput):Promise<{
        answer:string;
        resumes:PublicResumeView[];
    }>{
        const understood = await understandQuery(input.query);
        const [vector] = await embedMany([understood.semanticQuery])

        if(!vector){
            return {
                answer:"No matching resumes found.",
                resumes:[],
            }
        }

        const hits = await vectorRepository.search({
            vector,
            limit:CHUNK_LIMIT,
            filter:{
                source:"resume",
                ...(understood.city ? {city:understood.city} : {}),
                ...(understood.minExperienceYears != null
                    ? {minExperienceYears:understood.minExperienceYears}
                    : {}),
                ...(understood.skills.length > 0 ? {skills: understood.skills} : {}),
            }
        });

        const top = rankResumes(hits,understood).slice(0,RESULT_LIMIT);
        const documents = await resumeRepository.findByIds(top.map((item)=>item.resumeId));
        const byId = new Map(documents.map((doc)=>[doc._id.toString(),doc]));
        const resumes: PublicResumeView[] = top.flatMap((item): PublicResumeView[] => {
            const parsed = byId.get(item.resumeId)?.parsed;
            if (!parsed) return [];

            return [{
                id: item.resumeId,
                name: parsed.name,
                email: parsed.email,
                phone: parsed.phone,
                location: parsed.location,
                skills: parsed.skills,
                totalExperienceYears: parsed.totalExperienceYears,
                currentRole: parsed.currentRole,
                professionalSummary: parsed.professionalSummary,
                experience: parsed.experience,
                education: parsed.education,
                score: Number(item.score.toFixed(4)),
            }];
        });

        const evidenceByResumeId = new Map(top.map((item)=>[item.resumeId, item.evidence]));
        const answer = await writeGroundedAnswer({
            query:input.query,
            context:JSON.stringify(
                resumes.map((resume)=>({
                    ...resume,
                    evidence:evidenceByResumeId.get(resume.id) ?? [],
                }))
            )
        });

        return { answer,resumes}
    }
}

export const searchService = new SearchService();
