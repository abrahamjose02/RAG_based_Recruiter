import { AppError } from "../../errors/app-error";
import { recruiterRepository } from "./recruiter.repository";
import { CreateRecruiterInput, RecruiterLoginInput } from "./recruiter.schema";
import { comparePasswords, generateToken, hashPassword } from "./recruiter.utils";

class RecruiterService{
    async registerRecruiter(input:CreateRecruiterInput){
        const existingRecruiter = await recruiterRepository.findByEmailAndOrg(input.email,input.organizationId)
        if(existingRecruiter){
            throw new AppError("A Recruiter with same Email exists",409)
        }
        const hashedPassword = await hashPassword(input.password);

        const recruiter = await recruiterRepository.create({
            ...input,
            password:hashedPassword,
        })

        const token = generateToken({
            recruiterId:recruiter._id.toString(),
            organizationId:recruiter.organizationId.toString(),
            email:recruiter.email,
            role:recruiter.role
        })

        return {
            token,
            recruiter:{
                id:recruiter._id,
                email:recruiter.email,
                organization:recruiter.organizationId,
                firstName:recruiter.firstName,
                lastName:recruiter.lastName,
                role:recruiter.role
            },
        };
    }

    async loginRecruiter(input:RecruiterLoginInput){
        const recruiter = await recruiterRepository.findByEmail(input.email)
        if(!recruiter){
            throw new AppError("Invalid Email or Password",401)
        }
        const isPasswordValid = await comparePasswords(input.password,recruiter.password);
        if(!isPasswordValid){
            throw new AppError("Invalid Email or Password",401)
        }
        if(!recruiter.isActive){
            throw new AppError("Your account has been deactivated",403)
        }

        const token = generateToken({
            recruiterId:recruiter._id.toString(),
            organizationId:recruiter.organizationId.toString(),
            email:recruiter.email,
            role:recruiter.role,
        });

        return {
            token,
            recruiter:{
                id:recruiter._id,
                email:recruiter.email,
                firstName:recruiter.firstName,
                lastName:recruiter.lastName,
                organizationId:recruiter.organizationId,
                role:recruiter.role
            }
        };
    }

    async getRecruiter(id:string,organizationId:string){
            const recruiter = await recruiterRepository.findByIdAndOrg(id,organizationId)
            if(!recruiter){
                throw new AppError("Recruiter not found",404)
            }
            return recruiter
        }

    async listRecruiters(organizationId:string){
        return recruiterRepository.findByOrganization(organizationId)
    }

    async deactivateRecruiter(id:string,organizationId:string){
        const recruiter = await recruiterRepository.findByIdAndOrg(id,organizationId)
        if(!recruiter){
            throw new AppError("Recruiter not found",404)
        }
        return recruiterRepository.deactivateById(id)
    }
}

export const recruiterService = new RecruiterService();