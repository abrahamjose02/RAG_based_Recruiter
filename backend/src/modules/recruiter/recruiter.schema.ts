import z from "zod"

export const createRecruiterSchema = z.object({
    body:z.object({
        organizationId:z
            .string()
            .trim()
            .regex(/^[a-fA-F0-9]{24}$/,"Invalid organization ID"),
        email:z.string().trim().email("Invalid email address"),
        firstName:z.string().trim().min(1,"First name is required").max(100),
        lastName:z.string().trim().min(1,"Last name is required").max(100),
        password:z
            .string()
            .min(8,"Password must be atleast 8 characters")
            .regex(/[A-Z]/,"Password must contain an uppercase letter")
            .regex(/[0-9]/,"Password must contain a number"),
        role:z.enum(["admin","recruiter"]).default("recruiter"),
}),
});

export const recruiterLoginSchema = z.object({
    body:z.object({
        email:z.string().trim().email("Invalid email address"),
        password:z.string().min(1,"Password is required"),
    })
})

export const recrutierIdSchema = z.object({
    params:z.object({
        id:z
            .string()
            .trim()
            .regex(/^[a-fA-F0-9]/,"Invalid recruiter ID")
    }),
});

export type CreateRecruiterInput = z.infer<typeof createRecruiterSchema>["body"]

export type RecruiterLoginInput = z.infer<typeof recruiterLoginSchema>["body"]

export type RecruiterIdParams = z.infer<typeof recrutierIdSchema>["params"]
