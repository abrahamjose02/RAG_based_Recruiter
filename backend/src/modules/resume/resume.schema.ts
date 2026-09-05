import z, { success } from "zod";
import { RESUME_STATUSES } from "./resume.types.js";

const objectIdString = z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/,"Invalid ID")

export const uploadResumeSchema = z.object({
    body:z.object({
        candidateId:objectIdString.optional()
    })
})

export const resumeIdSchema = z.object({
    params:z.object({
        id:objectIdString
    })
})

export const listResumeSchema = z.object({
    query:z.object({
        candidateId:objectIdString.optional(),
        page:z.coerce.number().int().min(1).default(1),
        limit:z.coerce.number().int().min(1).max(100).default(20),
    }),
})

const parsedLocationSchema = z.object({
    city:z.string().trim().min(1).optional(),
    state:z.string().trim().min(1).optional(),
    country:z.string().trim().min(1).optional()
})

const parsedExperienceSchema = z.object({
    company: z.string().trim().min(1),
    role: z.string().trim().min(1),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isCurrent: z.boolean().optional(),
    description: z.string().trim().optional(),
  });

const parsedEducationSchema = z.object({
    institution: z.string().trim().min(1),
    degree: z.string().trim().optional(),
    fieldOfStudy: z.string().trim().optional(),
    startYear: z.number().int().optional(),
    endYear: z.number().int().optional(),
  });

  export const parsedResumeResultSchema = z.object({
    name: z.string().trim().optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().optional(),
    location: parsedLocationSchema.optional(),
    skills: z.array(z.string().trim().min(1)).default([]),
    totalExperienceYears: z.number().min(0).max(99).optional(),
    currentRole: z.string().trim().optional(),
    professionalSummary: z.string().trim().optional(),
    experience: z.array(parsedExperienceSchema).default([]),
    education: z.array(parsedEducationSchema).default([]),
  });

  export const resumeAiResponseSchema = z.object({
    success:z.literal(true),
    data:parsedResumeResultSchema,
  });

export type UploadResumeInput = z.infer<typeof uploadResumeSchema>["body"]
export type ResumeIdParams = z.infer<typeof resumeIdSchema>["params"];
export type ListResumesQuery = z.infer<typeof listResumeSchema>["query"];
export type ParsedResumeResultInput = z.infer<typeof parsedResumeResultSchema>;