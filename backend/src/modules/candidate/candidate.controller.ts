import type { Request,Response } from "express";
import { candidateService } from "./candidate.service.js";
import type { CreateCandidateInput,UpdateCandidateInput,CandidateIdParams,ListCandidatesQuery } from "./candidate.schema.js";
import type { CandidateQueryFilter } from "./candidate.repository.js";

export async function createCandidate(req:Request<Record<string,never>,unknown,CreateCandidateInput>,res:Response):Promise<void>{
    const candidate = await candidateService.createCandidate(req.body)

    res.status(201).json({
        success:true,
        data:candidate
    })
}

export async function getCandidates(req:Request,res:Response):Promise<void>{
    const {page,limit,...filter} = req.query as unknown as ListCandidatesQuery
    const result = await candidateService.getCandidates(
        JSON.parse(JSON.stringify(filter)) as CandidateQueryFilter,
        {page,limit}
    )

    res.status(200).json({
        success:true,
        data:result
    })
}

export async function getCandidateById(req:Request<CandidateIdParams>,res:Response):Promise<void>{
    const candidate = await candidateService.getCandidateById(req.params.id)

    res.status(200).json({
        success:true,
        data:candidate
    })
}

export async function updateCandidate(req:Request<CandidateIdParams,unknown,UpdateCandidateInput>,res:Response):Promise<void>{
    const candidate = await candidateService.updateCandidate(req.params.id,req.body)

    res.status(200).json({
        success:true,
        data:candidate
    })
}

export async function deleteCandidate(req:Request<CandidateIdParams>,res:Response):Promise<void>{
    const candidate = await candidateService.deleteCandidate(req.params.id)

    res.status(200).json({
        success:true,
        data:{
            id:candidate._id
        }
    })
}