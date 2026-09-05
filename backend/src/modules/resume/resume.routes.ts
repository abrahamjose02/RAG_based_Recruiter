import { Router, type RequestHandler } from "express";
import { AppError } from "../../errors/app-error.js";
import { validate } from "../../middleware/validation.middleware.js";
import { createResumeManifests, getResumeById, getResumes } from "./resume.controller.js";
import { listResumeSchema, resumeIdSchema, uploadResumeSchema } from "./resume.schema.js";

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

resumeRouter.post("/", rejectMultipartResumeUploads, validate(uploadResumeSchema), createResumeManifests);
resumeRouter.get("/", validate(listResumeSchema), getResumes);
resumeRouter.get("/:id", validate(resumeIdSchema), getResumeById);

export { resumeRouter };
