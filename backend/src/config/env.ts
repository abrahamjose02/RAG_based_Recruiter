import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
    NODE_ENV:z
        .enum(["development","test","production"])
        .default("development"),
    
    PORT:z.coerce.number().int().positive().default(500),
    MONGODB_URI:z
        .string()
        .min(1,"MONGODB_URI is required")
        .refine(
            (value)=>
                value.startsWith("mongodb://") ||
                value.startsWith("mongodb+srv://"),
                {
                    message:"MONGODB_URI must be a solid mongoDB connection string"
                },
        ),
    CORS_ORIGIN:z.string().default('http://localhost:3000'),
    JWT_SECRET:z.string().min(1,"JWT_SECRET is required"),
    JWT_EXPIRES_IN:z.coerce.number().int().positive().default(60*60*24*7), // 7 days expiry
    BCRYPT_ROUNDS:z.coerce.number().int().positive().default(10)
});

const parsedEnvironment  = envSchema.safeParse(process.env)

// this server will never start with a bad config

if (!parsedEnvironment.success) {
    console.error("Invalid environment configuration");
    console.error(
        JSON.stringify(parsedEnvironment.error.flatten().fieldErrors, null, 2),
    )
    process.exit(1)
}

export const env = parsedEnvironment.data