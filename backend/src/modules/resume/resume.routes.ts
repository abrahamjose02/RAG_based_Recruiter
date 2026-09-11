import { Router, type RequestHandler } from "express";
import { AppError } from "../../errors/app-error";
import { validate } from "../../middleware/validation.middleware";
import { createResume, getResumeById, getResumes } from "./resume.controller";
import { listResumeSchema, resumeIdSchema, uploadResumeSchema } from "./resume.schema";
import { authMiddleware } from "../../middleware/auth.middleware";

const resumeRouter = Router();

const rejectMultipartResumeUploads: RequestHandler = (req, _res, next) => {
    if (req.is("multipart/form-data")) {
        next(
            new AppError(
                "Resume binaries are uploaded directly from the client to object storage. Send a JSON document manifest with client-extracted text.",
                415,
            ),
        );
        return;
    }

    next();
};

resumeRouter.post("/",authMiddleware,rejectMultipartResumeUploads, validate(uploadResumeSchema), createResume);
resumeRouter.get("/",authMiddleware,validate(listResumeSchema), getResumes);
resumeRouter.get("/:id",authMiddleware,validate(resumeIdSchema), getResumeById);

export { resumeRouter };
