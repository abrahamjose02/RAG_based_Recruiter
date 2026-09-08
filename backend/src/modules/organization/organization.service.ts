import { AppError } from "../../errors/app-error";
import { organizationRepository } from "./organization.repository";
import type { createOrganizationInput } from "./organization.schema";


class OrganizationService{
    async createOrganization(input:createOrganizationInput){
        const existingOrganization = await organizationRepository.findByName(input.name)
        if(existingOrganization){
            throw new AppError("An organization with this name already exists",409)
        }
        return organizationRepository.create(input)
    }

    async getOrganization(id:string){
        const organization = await organizationRepository.findById(id)
        if(!organization){
            throw new AppError("Organization not found",404)
        }
        return organization
    }

    async listOrganization(){
        return organizationRepository.findMany()
    }

    async updateOrganization(id:string,input:Partial<createOrganizationInput>){
        const organization = await organizationRepository.updateById(id,input)
        if(!organization){
            throw new AppError("Organization not found ",404)
        }
        return organization
    }

    async deleteOrganization(id:string){
        const organization = await organizationRepository.deleteById(id)
        if (!organization) {
             throw new AppError("Organization not found", 404);
         }
         return organization
    }
}

export const organizationService = new OrganizationService();