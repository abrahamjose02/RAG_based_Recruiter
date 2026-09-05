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
    startDate:z.coerce.date().optional(),
    endDate:z.coerce.date().optional(),
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
    fieldOfStudy:z.string().trim().min(1).optional(),
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
    (np)=> np.option !== "serving" || np.lastWorkingDay != null,
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
        totalExperienceYears:z.number().min(0).max(99).default(0),
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

const objectIdString = z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/,"Invalid ID")

export const candidateIdSchema = z.object({
    params:z.object({
        id:objectIdString
    }),
});

export const listCandidatesSchema = z.object({
    query:z.object({
        skills:z
            .union([z.string(),z.array(z.string())])
            .optional()
            .transform((value)=>{
                if(!value) return undefined
                const items = Array.isArray(value) ? value : value.split(",")
                const skills = items.map((skill)=>skill.trim()).filter(Boolean)
                return skills.length > 0 ? skills : undefined
            }),
        city:z.string().trim().min(1).optional(),
        currentRole:z.string().trim().min(1).optional(),
        name:z.string().trim().min(1).optional(),
        phone:z.string().trim().min(1).optional(),
        noticePeriodOption:z.enum(NOTICE_PERIOD_OPTIONS).optional(),
        minExperienceYears:z.coerce.number().min(0).max(99).optional(),
        maxExperienceYears:z.coerce.number().min(0).max(99).optional(),
        minCurrentSalary:z.coerce.number().min(0).optional(),
        maxCurrentSalary:z.coerce.number().min(0).optional(),
        minExpectedSalary:z.coerce.number().min(0).optional(),
        maxExpectedSalary:z.coerce.number().min(0).optional(),
        page:z.coerce.number().int().min(1).default(1),
        limit:z.coerce.number().int().min(1).max(100).default(20),
    })
})

export type CreateCandidateInput = 
    z.infer<typeof createCandidateSchema>["body"];

export type UpdateCandidateInput = 
    z.infer<typeof updateCandidateSchema>["body"]

export type CandidateIdParams = 
    z.infer<typeof candidateIdSchema>["params"]

export type ListCandidatesQuery =
    z.infer<typeof listCandidatesSchema>["query"]