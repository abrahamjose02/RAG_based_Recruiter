import { Router, type RequestHandler } from "express";
import { AppError } from "../../errors/app-error";
import { validate } from "../../middleware/validation.middleware";
import { createResume, getResumeById, getResumes } from "./resume.controller";
import { listResumeSchema, resumeIdSchema, uploadResumeSchema } from "./resume.schema";

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

resumeRouter.post("/", rejectMultipartResumeUploads, validate(uploadResumeSchema), createResume);
resumeRouter.get("/", validate(listResumeSchema), getResumes);
resumeRouter.get("/:id", validate(resumeIdSchema), getResumeById);

export { resumeRouter };
