import { Schema,model,type HydratedDocument } from "mongoose";
import type { Candidate,CandidateEducation,CandidateExperience,CandidateLocation } from "./candidate.types.js";
import { string } from "zod";

const locationSchema = new Schema<CandidateLocation>(
    {
        city:{
            type:String,
            trim:true
            },
        state:{
            type:String,
            trim:true
            },
        country:{
            type:String,
            trim:true
            }
    },
    {_id:false}
);

const experienceSchema = new Schema<CandidateExperience>(
    {
        company:{
            type:String,
            trim:true
        },
        role:{
            type:String,
            trim:true
        },
        startDate:Date,
        endDate:Date,
        isCurrent:Boolean,
        description:{
            type:String,
            trim:true
        },
    },
    {_id:false}
)

const educationSchema = new Schema<CandidateEducation>(
    {
        institution:String,
        degree:String,
        fieldOfStudy:{
            type:String,
            required:true,
        },
        startYear:Number,
        endYear:Number,
    },
    {_id:false}
);

const candidateSchema = new Schema<Candidate>(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        phone:String,
        location:locationSchema,
        skills:{
            type:[String],
            required:true,
            default:[]
        },
        totalExperienceYears:{
            type:Number,
            required:true
        },
        currentRole:String,
        professionalSummary:{
            type:String,
            trim:true
        },
        experience:{
            type:[experienceSchema],
            default:[]
        },
        education:{
            type:[educationSchema],
            default:[]
        },
    },
    {timestamps:true}
)

export type CandidateDocument = HydratedDocument<Candidate>;
export const CandidateModel = model<Candidate>("Candidate",candidateSchema)