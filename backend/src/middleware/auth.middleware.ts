import { Request,Response,NextFunction } from "express";
import { verifyToken } from "../modules/recruiter/recruiter.utils";
import { AppError } from "../errors/app-error";

export function authMiddleware(req:Request,_res:Response,next:NextFunction):void{
    try {
        const authHead = req.headers.authorization;
        if(!authHead || !authHead.startsWith("Bearer ")){
            throw new AppError("Missing or invalid authorization header",401)
        }
        const token = authHead.substring(7)
        const payload = verifyToken(token)

        req.recruiter = payload;
        next()
    } catch (error) {
        if(error instanceof AppError){
            throw error
        }
        throw new AppError("Invalid or expired Token",401)
    }
}

export function optionalAuthMiddleware(req:Request,_res:Response,next:NextFunction):void{
    try {
        const authHeader = req.headers.authorization;
        if(authHeader && authHeader.startsWith("Bearer ")){
            const token = authHeader.substring(7)
            const payload = verifyToken(token)
            req.recruiter = payload
        }
    } catch (error) {

    }
    next();
}