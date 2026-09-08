import { Schema,model, type HydratedDocument } from "mongoose";
import type { Recruiter } from "./recruiter.types";

const recruiterSchema = new Schema<Recruiter>(
    {
        organizationId:{
            type:Schema.Types.ObjectId,
            ref:"Organization",
            index:true
        },
        email:{
            type:String,
            trim:true,
            required:true,
            lowercase:true
        },
        firstName:{
            type:String,
            trim:true,
            required:true
        },
        lastName:{
            type:String,
            trim:true,
            required:true
        },
        password:{
            type:String,
            required:true,
            select:false // Never return a password in queries
        },
        role:{
            type:String,
            enum:["admin","recruiter"],
            default:"recruiter"
        },
        isActive:{
            type:Boolean,
            default:true
        },
    },
    {timestamps:true}
)

recruiterSchema.index({email:1})
recruiterSchema.index({organizationId:1})

export type RecruiterDocument = HydratedDocument<Recruiter>;
export const RecruiterModel = model<Recruiter>("Recruiter",recruiterSchema)