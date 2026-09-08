import { Request,Response } from "express";
import { organizationService } from "./organization.service";
import type { createOrganizationInput,organizationIdIParams } from "./organization.schema";

export async function createOrganization(req:Request<Record<string,never>,unknown,createOrganizationInput>,res:Response):Promise<void>{
    const organization = await organizationService.createOrganization(req.body);

    res.status(201).json({success:true,data:organization})

}

export async function getOrganization(req:Request<organizationIdIParams>,res:Response):Promise<void>{
    const organization = await organizationService.getOrganization(req.params.id)

    res.status(200).json({success:true,data:organization})
}

export async function listOrganization(req:Request,res:Response):Promise<void>{
    const organization = await organizationService.listOrganization();

    res.status(200).json({
        success:true,
        data:organization
    })
}

export async function updateOrganization(req:Request<organizationIdIParams,unknown,Partial<createOrganizationInput>>,res:Response):Promise<void>{
    const updatedOrganization = await organizationService.updateOrganization(req.params.id,req.body)

    res.status(200).json({
        success:true,
        data:updateOrganization
    })
}

export async function deleteOrganization(req:Request<organizationIdIParams>,res:Response){
    const deleteOrganization = await organizationService.deleteOrganization(req.params.id)

    res.status(200).json({
        success:true,
        data:{
            id:deleteOrganization._id
        }
    })
}
