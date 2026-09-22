import type { Request, Response } from "express";
import { resumeService } from "./resume.service";
import type { ListResumesQuery, ResumeIdParams, UploadResumeInput } from "./resume.schema";

export async function createResume(
    req: Request<Record<string, never>, unknown, UploadResumeInput>,
    res: Response,
): Promise<void> {
    const resumes = await resumeService.createResume({...req.body,
        organizationId:req.recruiter!.organizationId,
        recruiterId:req.recruiter!.recruiterId
    });

    res.status(201).json({
        success: true,
        data: resumes,
    });
}

export async function getResumes(req: Request, res: Response): Promise<void> {
    const { page, limit, candidateId,recruiterId,mine } = req.query as unknown as ListResumesQuery;
    const result = await resumeService.getResumes(
        {
            ...(candidateId ?  {candidateId} : {}),
            ...(mine ? {recruiterId:req.recruiter!.recruiterId} : {}),
            ...(!mine && recruiterId ? {recruiterId} : {} )
        },
        {page,limit}
    )

    res.status(200).json({
        success: true,
        data: result,
    });
}

export async function getResumeById(req: Request<ResumeIdParams>, res: Response): Promise<void> {
    const resume = await resumeService.getResumeById(req.params.id);

    res.status(200).json({
        success: true,
        data: resume,
    });
}
