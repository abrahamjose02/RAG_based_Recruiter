import z from "zod";

export const CreateOrganizationSchema = z.object({
    body: z.object({
        name:z.string().min(1,'Organization name is required').max(255),
        industry:z.string().optional(),
        description:z.string().optional(),
        website:z.string().url().optional()
    })
});

export const organizationIdSchema = z.object({
    params:z.object({
        id:z.string()
            .trim()
            .regex(/^[a-fA-F0-9]{24}$/,"Invalid organization ID")
    })
})

export type createOrganizationInput = z.infer<typeof CreateOrganizationSchema>["body"]

export type organizationIdIParams = z.infer<typeof organizationIdSchema>["params"]