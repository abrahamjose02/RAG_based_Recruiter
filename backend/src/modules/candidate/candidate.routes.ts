import { Router } from "express";
import { validate } from "../../middleware/validation.middleware";
import { createCandidateSchema,updateCandidateSchema,candidateIdSchema,listCandidatesSchema } from "./candidate.schema";
import { createCandidate,getCandidateById,getCandidates,updateCandidate,deleteCandidate } from "./candidate.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const candidateRouter = Router()

candidateRouter.use(authMiddleware)

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