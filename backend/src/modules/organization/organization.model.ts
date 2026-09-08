import { Schema,model, type HydratedDocument } from "mongoose";
import type { Organization } from "./organization.types.ts";

const organizationSchema = new Schema<Organization>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            maxLength:255,
            index:true
        },
        industry:{
            type:String,
            trim:true
        },
        description:{
            type:String,
            trim:true
        },
        website:{
            type:String,
            trim:true
        }
    },
    {timestamps:true}
)

export type OrganizationDocument = HydratedDocument<Organization>

export const organizationModel = model<Organization>("Organization",organizationSchema)