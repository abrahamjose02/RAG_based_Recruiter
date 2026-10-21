import z from "zod";

export const recruiterSearchSchema = z.object({
    body:z.object({
        query:z.string().trim().min(3).max(2000),
    })
})

export type RecruiterSearchInput = z.infer<typeof recruiterSearchSchema>["body"];