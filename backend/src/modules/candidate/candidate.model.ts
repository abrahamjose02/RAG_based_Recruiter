import { Schema,model,type HydratedDocument } from "mongoose";
import { CANDIDATE_SOURCES, type CandidateNoticePeriod, type Candidate, type CandidateEducation, type CandidateExperience, type CandidateLocation } from "./candidate.types.js";
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
        fieldOfStudy:String,
        startYear:Number,
        endYear:Number,
    },
    {_id:false}
);

const noticePeriodSchema = new Schema<CandidateNoticePeriod>(
    {
        option:{
            type:String,
            enum:[
                "immediate",
                "15_days",
                "30_days",
                "45_days",
                "60_days",
                "90_days",
                "serving",
            ],
        },
        lastWorkingDay:Date,
    },
    {_id:false}
)

const candidateSchema = new Schema<Candidate>(
    {
        organizationId:{
            type:Schema.Types.ObjectId,
            ref:"Organization",
            index:true
        },
        recruiterId:{
            type:Schema.Types.ObjectId,
            ref:"Recruiter",
            index:true
        },
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            unique:true
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
        currentSalary:{
            type:Number,
            min:0
        },
        expectedSalary:{
            type:Number,
            min:0
        },
        noticePeriod:noticePeriodSchema,
        source:{
            type:String,
            enum:[...CANDIDATE_SOURCES],
            required:true,
            default:"manual"
        },
        sourceResumeIds:{
            type:[String],
            default:[]
        },
    },
    {timestamps:true}
)

candidateSchema.index({skills:1})
candidateSchema.index({organizationId:1,email:1})
candidateSchema.index({organizationId:1,"location.city":1,totalExperienceYears:1})
candidateSchema.index({"location.city":1,totalExperienceYears:1,createdAt:-1})
candidateSchema.index({currentRole:1,totalExperienceYears:1})
candidateSchema.index({name:1})
candidateSchema.index({phone:1},{sparse:true})
candidateSchema.index({createdAt:-1})
candidateSchema.index({"noticePeriod.option":1})
candidateSchema.index({"expectedSalary":1})
candidateSchema.index({"currentSalary":1})
candidateSchema.index({"noticePeriod.lastWorkingDay":1})

noticePeriodSchema.pre("validate", async function(){
    if(this.option === "serving" && !this.lastWorkingDay){
       throw new Error("last WorkingDay is required when serving notice period")
    }
    if(this.option !== "serving"){
        this.lastWorkingDay = undefined;
    }
})

export type CandidateDocument = HydratedDocument<Candidate>;
export const CandidateModel = model<Candidate>("Candidate",candidateSchema)