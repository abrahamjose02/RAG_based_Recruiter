import { Router } from "express";
import { validate } from "../../middleware/validation.middleware.js";
import { createCandidateSchema,updateCandidateSchema,candidateIdSchema,listCandidatesSchema } from "./candidate.schema.js";
import { createCandidate,getCandidateById,getCandidates,updateCandidate,deleteCandidate } from "./candidate.controller.js";

const candidateRouter = Router()

candidateRouter.post("/",validate(createCandidateSchema),createCandidate)
candidateRouter.get("/",validate(listCandidatesSchema),getCandidates)
candidateRouter.get("/:id",validate(candidateIdSchema),getCandidateById)
candidateRouter.patch("/:id",
    validate(candidateIdSchema),
    validate(updateCandidateSchema),
    updateCandidate
)
candidateRouter.delete("/:id", validate(candidateIdSchema),deleteCandidate)

export {candidateRouter}