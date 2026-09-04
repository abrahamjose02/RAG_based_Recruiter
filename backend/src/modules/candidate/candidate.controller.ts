import type { Request,Response } from "express";
import { candidateService } from "./candidate.service.js";
import type { CreateCandidateInput,UpdateCandidateInput,CandidateIdParams } from "./candidate.schema.js";

export async function createCandidate(req:Request<Record<string,never>,unknown,CreateCandidateInput>,res:Response):Promise<void>{
    const candidate = await candidateService.createCandidate(req.body)

    res.status(201).json({
        success:true,
        data:candidate
    })
}

export async function getCandidates(_req:Request,res:Response):Promise<void>{
    const result = await candidateService.getCandidates();

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