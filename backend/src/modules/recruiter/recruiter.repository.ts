import { RecruiterModel, type RecruiterDocument } from "./recruiter.model";
import type { CreateRecruiterInput } from "./recruiter.schema";
import { isValidObjectId } from "mongoose";

class RecruiterRepository{
    async create(data:CreateRecruiterInput & {password:string}):Promise<RecruiterDocument>{
        const recruiter = await RecruiterModel.create(JSON.parse(JSON.stringify(data)))
        return recruiter
    }

    async findById(id:string):Promise<RecruiterDocument | null>{
        if(!isValidObjectId(id)){
            return null
        }
        return RecruiterModel.findById(id)
    }

    async findByEmail(email:string):Promise<RecruiterDocument | null>{
        return RecruiterModel.findOne({email:email.toLowerCase().trim()}).select("+password");
    }

    async findByEmailAndOrg(email:string,organizationId:string):Promise<RecruiterDocument | null>{
        return RecruiterModel.findOne({email:email.toLowerCase().trim(),organizationId}).select("+password")
    }

    async findByIdAndOrg(id:string,organizationId:string):Promise<RecruiterDocument | null>{
        if(!isValidObjectId){
            return null
        }
        return RecruiterModel.findOne({_id:id,organizationId,isActive:true})
    }

    async findByOrganization(organizationId:string):Promise<RecruiterDocument | null>{
        if(!isValidObjectId){
            return null
        }
        return RecruiterModel.findOne({organizationId,isActive:true}).sort({createdAt:-1});
    }

    async updateById(id:string,data:Partial<CreateRecruiterInput>):Promise<RecruiterDocument | null>{
        if(!isValidObjectId){
            return null
        }
        return RecruiterModel.findByIdAndUpdate(id,{$set:data},
            {
                new:true,
                runValidators:true
            }
        )
    }

    async deactivateById(id:string):Promise<RecruiterDocument | null>{
        if(!isValidObjectId){
            return null
        }
        return RecruiterModel.findByIdAndUpdate(id,{$set:{isActive:false}},{new:true})
    }
}

export const recruiterRepository = new RecruiterRepository();