import "dotenv/config"
import { z } from "zod"

const optionalSecret = z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value : undefined))

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce.number().int().positive().default(5000),
    MONGODB_URI: z
        .string()
        .min(1, "MONGODB_URI is required")
        .refine(
            (value) =>
                value.startsWith("mongodb://") ||
                value.startsWith("mongodb+srv://"),
            {
                message: "MONGODB_URI must be a solid mongoDB connection string",
            },
        ),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRES_IN: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
    BCRYPT_ROUNDS: z.coerce.number().int().positive().default(10),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    RESUME_PARSER_MODEL: z.string().min(1).default("gpt-4o-mini"),
    EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
    EMBEDDING_VERSION: z.string().min(1).default("text-embedding-3-small-v1"),
    QDRANT_URL: z.string().url("QDRANT_URL must be a valid URL").default("http://localhost:6333"),
    QDRANT_API_KEY: optionalSecret,
    QDRANT_COLLECTION: z.string().min(1).default("resume_chunks"),
})

const parsedEnvironment = envSchema.safeParse(process.env)

if (!parsedEnvironment.success) {
    console.error("Invalid environment configuration")
    console.error(
        JSON.stringify(parsedEnvironment.error.flatten().fieldErrors, null, 2),
    )
    process.exit(1)
}

export const env = parsedEnvironment.data
