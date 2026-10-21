import type { Request, Response } from "express";
import type { RecruiterSearchInput } from "./search.schema";
import {searchService} from "./search.services";

export async function searchResume(
    req:Request<Record<string,never>,unknown,RecruiterSearchInput>,
    res:Response
):Promise<void>{
    const result = await searchService.search(req.body);
    res.status(200).json({success:true,data:result});
}