export interface Recruiter{
    id:string;
    organizationId:string;
    email:string;
    firstName:string;
    lastName:string;
    password:string;
    role:"admin" | "recruiter";
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