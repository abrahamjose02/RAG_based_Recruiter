import type { Request,Response } from "express";
import { getHealthStatus } from "./health.service.js";

export function getHealth(req:Request,res:Response):void{
    const health = getHealthStatus()

    const statusCode = health.status === "ok" ? 200 : 503

    res.status(statusCode).json({
        success:health.status === "ok",
        data:health
    })
}