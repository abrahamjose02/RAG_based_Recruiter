import { Types } from "mongoose";

export const RECRUITER_ROLES = ["admin", "recruiter"] as const;
export type RecruiterRole = (typeof RECRUITER_ROLES)[number];

export interface Recruiter{
    id:string;
    organizationId:Types.ObjectId;
    email:string;
    firstName:string;
    lastName:string;
    password:string;
    role:RecruiterRole;
    isActive:boolean;
    createdAt:Date;
    updatedAt:Date;
}

export interface JWTPayload{
    recruiterId:string;
    organizationId:string;
    email:string;
    role:string;
}
