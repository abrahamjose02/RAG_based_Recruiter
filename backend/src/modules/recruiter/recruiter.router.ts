import { Router } from "express";
import { validate } from "../../middleware/validation.middleware";
import { createRecruiterSchema,recruiterLoginSchema,recrutierIdSchema } from "./recruiter.schema";
import { deactivateRecruiter, getRecruiter, listRecruiters, loginRecruiter, registerRecruiter } from "./recruiter.controller";
import { authMiddleware } from "../../middleware/auth.middleware";


const recruiterRouter = Router()

recruiterRouter.post("/register",validate(createRecruiterSchema),registerRecruiter)
recruiterRouter.post("/login",validate(recruiterLoginSchema),loginRecruiter)
recruiterRouter.get("/me",authMiddleware,getRecruiter)
recruiterRouter.get("/",authMiddleware,listRecruiters)
recruiterRouter.delete("/:id",authMiddleware,validate(recrutierIdSchema),deactivateRecruiter)


export {recruiterRouter};