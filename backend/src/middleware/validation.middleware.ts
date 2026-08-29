import type { Request,Response,NextFunction } from "express";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";
// Generic request validation middleware


type RequestParts = {
    body?: unknown;
    query?: unknown;
    params?: unknown;
  };

export function validate<T extends RequestParts>(schema:ZodType<T>){
    return(
        req:Request,
        _res:Response,
        next:NextFunction
    ):void =>{
        const result = schema.safeParse({
            body:req.body,
            query:req.query,
            params:req.params
        });
        if(!result.success){
            // Here we convert the zod Error into Application's standardized Error System

            const message = result.error.issues
                .map((issue)=>{
                    const location = issue.path.join(".");

                    return location ? `${location} : ${issue.message}` : issue.message
                })
                .join(",")
            next(new AppError(`Validation failed : ${message}`,400));
            return;
        }
        req.body = result.data.body ?? req.body
        if(result.data.params){
            req.params = result.data.params as typeof req.params
        }
        next();
    }
}