import { Router } from "express";
import { searchResume } from "./search.controller";
import { validate } from "../../middleware/validation.middleware";
import { recruiterSearchSchema } from "./search.schema";

const searchRouter = Router();

searchRouter.post("/",validate(recruiterSearchSchema),searchResume);

export default searchRouter;