import { Schema,Model,type HydratedDocument,type Types, model } from "mongoose";
import type { CandidateLocation } from "../candidate/candidate.types.js";
import { RESUME_STATUSES, type ParsedEducation, type ParsedExperience,type ParsedResumeResult, type Resume } from "./resume.types.js";

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
        },
    },
    {_id:false}
)

const ParsedExperienceSchema = new Schema<ParsedExperience>(
    {
        company:{
            type:String,
            required:true,
            trim:true
        },
        role:{
            type:String,
            requried:true,
            trim:true
        },
        startDate:String,
        endDate:String,
        isCurrent:Boolean,
        description:{
            type:String,
            trim:true
        }
    },
    {_id:false}
);

const parsedEducationSchema = new Schema<ParsedEducation>(
    {
        institution:{
            type:String,
            required:true,
            trim:true
        },
        degree:String,
        fieldOfStudy:String,
        startYear:Number,
        endYear:Number,
    },
    {_id:false}
)

const parsedResumeSchema = new Schema<ParsedResumeResult>(
    {
        name:String,
        email:{
            type:String,
            required:true,
            lowercase:true,
            trim:true
        },
        phone:String,
        location:locationSchema,
        skills:{
            type:[String],
            default:[]
        },
        totalExperienceYears:Number,
        currentRole:String,
        professionalSummary:{
            type:String,
            trim:true
        },
        experience:{
            type:[ParsedExperienceSchema],
            default:[]
        },
        education:{
            type:[parsedEducationSchema],
            default:[]
        }
    },
    {_id:false}
)

const resumeSchema = new Schema<Resume>(
    {
        candidateId:{
            type:Schema.Types.ObjectId,
            ref:"Candidate",
            index:true
        },
        originalFilename:{
            type:String,
            required:true,
            trim:true
        },
        storageKey:{
            type:String,
            required:true
        },
        mimeType:{
            type:String,
            required:true
        },
        sizeBytes:{
            type:Number,
            required:true
        },
        status:{
            type:String,
            enum:[...RESUME_STATUSES],
            required:true,
            default:"uploaded",
            index:true
        },
        parsed:parsedResumeSchema,
        indexedChunks:{
            type:Number,
            default:0,
            min:0
        },
        errorMessage:String
    },
    {timestamps:true}
)

resumeSchema.index({candidateId:1,createdAt:-1})
resumeSchema.index({status:1,createdAt:-1})

export type ResumeDocument = HydratedDocument<Resume>;
export const ResumeModel = model<Resume>("Resume",resumeSchema);