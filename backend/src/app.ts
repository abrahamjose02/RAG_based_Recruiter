import express from "express"
import cors from "cors"
import helmet from "helmet"

import { env } from "./config/env.js"
import { healthRouter } from "./modules/health/health.routes.js"
import { notFoundMiddleware } from "./middleware/not-found.middleware.js"
import { errorMiddleware } from "./middleware/errror.middleware.js"

export const app = express()

app.use(helmet())

app.use(cors({origin:env.CORS_ORIGIN,credentials:true}))

//Parse the standard URL-encoded form bodies
app.use(express.urlencoded({extended:true}))

//The size limit prevents clients from sending arbitrarly huge JSON bodies.
app.use(express.json({limit:"1mb"}))

app.use("/api/v1/health",healthRouter)

app.use(notFoundMiddleware)

app.use(errorMiddleware)