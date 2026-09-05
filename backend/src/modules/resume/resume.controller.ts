import type { Request, Response } from "express";
import { resumeService } from "./resume.service.js";
import type { ListResumesQuery, ResumeIdParams, UploadResumeInput } from "./resume.schema.js";
import type { ResumeQueryFilter } from "./resume.repository.js";

export async function createResumeManifests(
    req: Request<Record<string, never>, unknown, UploadResumeInput>,
    res: Response,
): Promise<void> {
    const resumes = await resumeService.createResumeManifests(req.body);

    res.status(201).json({
        success: true,
        data: resumes,
    });
}

export async function getResumes(req: Request, res: Response): Promise<void> {
    const { page, limit, ...filter } = req.query as unknown as ListResumesQuery;
    const result = await resumeService.getResumes(
        JSON.parse(JSON.stringify(filter)) as ResumeQueryFilter,
        { page, limit },
    );

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
