import { organizationModel, type OrganizationDocument } from "./organization.model";
import { isValidObjectId } from "mongoose";
import { createOrganizationInput } from "./organization.schema";

class OrganizationRepository{
    async create(data:createOrganizationInput):Promise<OrganizationDocument>{
        const organization = await organizationModel.create(
            JSON.parse(JSON.stringify(data))
        )
        return organization;
    }

    async findById(id:string):Promise<OrganizationDocument | null>{
        if(!isValidObjectId(id)){
            return null
        }
        return organizationModel.findById(id);
    }

    async findByName(name:string):Promise<OrganizationDocument | null>{
        return organizationModel.findOne({name:name.trim()})
    }

    async findMany(): Promise<OrganizationDocument[]> {
    return organizationModel.find({}).sort({ createdAt: -1 });
  }

  async updateById(id:String,data:Partial<createOrganizationInput>):Promise<OrganizationDocument | null>{
    if(!isValidObjectId(id)){
        return null
    }
    return organizationModel.findByIdAndUpdate(id,{$set:data},
        {new:true , runValidators:true}
    )
  }

  async deleteById(id:string):Promise<OrganizationDocument | null>{
    if(!isValidObjectId(id)){
        return null
    }
    return organizationModel.findByIdAndDelete(id)
  }
}

export const organizationRepository = new OrganizationRepository();