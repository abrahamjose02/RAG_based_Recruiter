import express from "express"
import cors from "cors"
import helmet from "helmet"

import { env } from "./config/env"
import { healthRouter } from "./modules/health/health.routes"
import { notFoundMiddleware } from "./middleware/not-found.middleware"
import { errorMiddleware } from "./middleware/errror.middleware"
import { candidateRouter } from "./modules/candidate/candidate.routes"
import { resumeRouter } from "./modules/resume/resume.routes"
import { organizationRouter } from "./modules/organization/organization.routes"

export const app = express()

app.use(helmet())

app.use(cors({origin:env.CORS_ORIGIN,credentials:true}))

//Parse the standard URL-encoded form bodies
app.use(express.urlencoded({extended:true}))

//The size limit allows resume text manifests without accepting binary uploads.
app.use(express.json({limit:"5mb"}))

app.use("/api/v1/health",healthRouter)
app.use("/api/v1/candidates",candidateRouter)
app.use("/api/v1/resumes",resumeRouter)
app.use("/api/v1/organization",organizationRouter)

app.use(notFoundMiddleware)

app.use(errorMiddleware)
