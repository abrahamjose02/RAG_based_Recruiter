//centralized error hander

//Instead of every controller repeating try/catch + reponse formating
// this error  eventually flow here.

// This keeps our API response consistent

import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/app-error.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { success } from "zod";

export const errorMiddleware:ErrorRequestHandler = (error,_req,res,_next):void => {
    logger.error("Request failed",error)

    if(error instanceof AppError){
        res.status(error.statusCode).json({
            success:false,
            error: {
                message:error.message
            }
        })
        return
    }

    //unexpected errors should not expose the internal details to the production users

    //Dev mode can include all these details for the product improvement

    const message = env.NODE_ENV === "production"
        ? "Internal Server Error"
        : error instanceof Error
            ? error.message:
            "Unknown Error";

    res.status(500).json({
        success:false,
        error:{
            message,
            ...(env.NODE_ENV !== "production" &&
                error instanceof Error
                ? {stack : error.stack} 
                : {}
            )
        }
    })
}

