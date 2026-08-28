//validation schema protects the application boundary
import z from "zod";
import { NOTICE_PERIOD_OPTIONS } from "./candidate.types.js";

const locationSchema = z.object({
    city:z.string().trim().min(1).optional(),
    state:z.string().trim().min(1).optional(),
    country:z.string().trim().min(1).optional()
})

const experienceSchema = z.object({
    company:z.string().trim().min(1),
    role:z.string().trim().min(1),
    startDate:z.number().int().min(1950).max(new Date().getFullYear() + 6).optional(),
    endDate:z.number().int().min(1950).max(new Date().getFullYear() + 6).optional(),
    isCurrent:z.boolean().default(false),
    description:z.string().trim().optional()
}).refine(
    (experience) =>
        !experience.startDate ||
        !experience.endDate || 
        experience.endDate >= experience.startDate,
        {
            message:"Experience endDate cannot be before startDate",
            path:["endDate"]
        }
)

const educationSchema = z.object({
    institution:z.string().trim().min(1),
    degree:z.string().trim().optional(),
    fieldOfStudy:z.string().trim().optional(),
    startYear:z.number().int().optional(),
    endYear:z.number().int().optional()
}).refine(
    (education)=>
        !education.startYear || 
        !education.endYear ||
        education.endYear >= education.startYear,
        {
            message:"Education endYear cannot be before startYear",
            path:["endYear"]
        },
);

const noticePeriodSchema = z.object({
    option:z.enum(NOTICE_PERIOD_OPTIONS),
    lastWorkingDay:z.coerce.date().optional(),
}).refine(
    (np)=> np.option !== "serving" || np.lastWorkingDay !== null,
    {
        message:"lastWorkingDay is required when serving notice period",
        path:["lastWorkingDay"]
    }
)

export const createCandidateSchema = z.object({
    body: z.object({
        name:z.string().trim().min(2).max(120),
        email:z.string().trim().email(),
        phone:z.string().trim().optional(),
        location:locationSchema.optional(),
        skills:z.array(z.string().trim().min(1)).default([]),
        totalExperience:z.number().min(0).max(99).default(0),
        currentSalary:z.number().min(0).optional(),
        expectedSalary:z.number().min(0).optional(),
        noticePeriod:noticePeriodSchema.optional(),
        currentRole:z.string().trim().optional(),
        professionalSummary:z.string().trim().max(8000).optional(),
        experience:z.array(experienceSchema).default([]),
        education:z.array(educationSchema).default([]),
    })
})

export const updateCandidateSchema = z.object({
    body:createCandidateSchema.shape.body.partial().refine(
        (body)=> Object.keys(body).length > 0,
        {
            message:"At least one candidate field must be provided"
        }
    )
})