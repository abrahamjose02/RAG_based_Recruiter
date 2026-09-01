import { CandidateModel,type CandidateDocument } from "./candidate.model.js";
import type { CreateCandidateInput,UpdateCandidateInput } from "./candidate.schema.js";
import { isValidObjectId, type QueryFilter } from "mongoose";
import type { Candidate, NoticePeriodOption } from "./candidate.types.js";

// Repositories owns the Database persistence logic.

export type CandidateQueryFilter = {
    skills?:string[];
    city?:string;
    currentRole?:string;
    name?:string;
    phone?:string;
    noticePeriodOption?:NoticePeriodOption;
    minExperienceYears?:number;
    maxExperienceYears?:number;
    minCurrentSalary?:number;
    maxCurrentSalary?:number;
    minExpectedSalary?:number;
    maxExpectedSalary?:number;
}

export type FindManyOptions = {
    page?:number;
    limit?:number;
    sort?:Record<string,1 | -1>
}

function stripUndefined<T>(value:T):T{
    return JSON.parse(JSON.stringify(value))
}

function escapeRegex(value:string):string{
    return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
}

class CandidateRepository{
    async create(data:CreateCandidateInput):Promise<CandidateDocument>{
        const candidate = await CandidateModel.create(
            JSON.parse(JSON.stringify(data))
        )
        return candidate
    }
    
   async findById(id:string):Promise<CandidateDocument | null >{
    if(!isValidObjectId){
        return null
    }
    return CandidateModel.findById(id)
   }

   async findByEmail(email:string):Promise<CandidateDocument | null>{
    return CandidateModel.findOne({email:email.toLowerCase()})
   }

   async findMany(filter:CandidateQueryFilter={},
    options:FindManyOptions = {},
   ):Promise<{items:CandidateDocument[]; total:number}>{
    const query:QueryFilter<Candidate> = {}

    if(filter.skills){
        query.skills = {$all:filter.skills}
    }
    if(filter.city){
        query["location.city"] = filter.city
    }
    if(filter.currentRole){
        query.currentRole = filter.currentRole
    }
    if(filter.name){
        query.name = filter.name
    }
    if(filter.phone){
        query.phone = filter.phone
    }
    if(filter.noticePeriodOption){
        query["noticePeriod.option"] = filter.noticePeriodOption
    }
    if(filter.minExperienceYears != null || filter.maxExperienceYears != null){
        query.totalExperienceYears = {
            ...(filter.minExperienceYears != null && {
                $gte:filter.minExperienceYears
            }),
            ...(filter.maxExperienceYears != null && {
                $lte: filter.maxExperienceYears
            }),
        };
    }
    if(filter.minCurrentSalary != null || filter.maxCurrentSalary != null){
        query.currentSalary = {
            ...(filter.minCurrentSalary != null && {
                $gte:filter.minCurrentSalary
            }),
            ...(filter.maxCurrentSalary != null && {
                $lte:filter.maxCurrentSalary
            }),
        };
    }
    if(filter.minExpectedSalary != null || filter.maxExpectedSalary != null){
        query.expectedSalary = {
            ...(filter.minExpectedSalary != null && {
                $gte:filter.minExpectedSalary
            }),
            ...(filter.maxExpectedSalary != null && {
                $lte:filter.maxExpectedSalary
            }),
        };
    }

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page-1)*limit;
    const sort = options.sort ?? {createdAt:-1};

    const[items,total] = await Promise.all([
         CandidateModel.find(query).sort(sort).skip(skip).limit(limit),
         CandidateModel.countDocuments(query),
    ])

    return{items,total}

   }

   async updateById(id:string,data:UpdateCandidateInput):Promise<CandidateDocument | null>{
    if(!isValidObjectId){
        return null
    }
    return CandidateModel.findByIdAndUpdate(id,
        {$set:stripUndefined(data)},
        {new:true,runValidators:true}
    )
   }

   async deleteById(id:string):Promise<CandidateDocument | null>{
    if(!isValidObjectId){
        return null
    }
    return CandidateModel.findByIdAndDelete(id);
   }
}

export const candidateRepository = new CandidateRepository();