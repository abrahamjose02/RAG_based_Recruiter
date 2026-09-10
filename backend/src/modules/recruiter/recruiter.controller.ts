import { Request, Response } from "express";
import { CreateRecruiterInput, RecruiterIdParams, RecruiterLoginInput } from "./recruiter.schema";
import { recruiterService } from "./recruiter.service";

declare global{
    namespace Express{
        interface Request{
            recruiter:{
                recruiterId:string;
                organizationId:string;
                email:string;
                role:string;
            }
        }
    }
}

export async function registerRecruiter(req:Request<Record<string,never>,unknown,CreateRecruiterInput>,res:Response):Promise<void>{
    const register = await recruiterService.registerRecruiter(req.body);

    res.status(201).json({
        success:true,
        data:register
    })
}

export async function loginRecruiter(req:Request<Record<string,never>,unknown,RecruiterLoginInput>,res:Response):Promise<void>{
    const login = await recruiterService.loginRecruiter(req.body);
    
    res.status(200).json({
        success:true,
        data:login
    })
}

export async function getRecruiter(req:Request,res:Response):Promise<void>{
    const recruiter = await recruiterService.getRecruiter(req.recruiter!.recruiterId,req.recruiter!.organizationId)

    res.status(200).json({
        success:true,
        data:recruiter
    })
}

export async function listRecruiters(req:Request,res:Response):Promise<void>{
    const recruiters = await recruiterService.listRecruiters(req.recruiter!.organizationId)

    res.status(200).json({
        success:true,
        data:recruiters
    })
}

export async function deactivateRecruiter(req:Request<RecruiterIdParams>,res:Response):Promise<void>{
    const recruiter = await recruiterService.deactivateRecruiter(req.params.id,req.recruiter!.organizationId);

    res.status(200).json({
        success:true,
        data:{
            id:recruiter?._id
        }
    })
}