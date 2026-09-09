import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from "../../config/env";
import type { JWTPayload } from "./recruiter.types";

export async function hashPassword(password:string):Promise<string>{
    return bcrypt.hash(password,env.BCRYPT_ROUNDS)
}

export async function comparePasswords(plainPassword:string,hashedPassword:string):Promise<boolean>{
    return bcrypt.compare(plainPassword,hashedPassword)
}

export function generateToken(payload:JWTPayload):string{
    const options: SignOptions = {
        expiresIn: env.JWT_EXPIRES_IN
    }
    return jwt.sign(payload, env.JWT_SECRET, options)
}

export function verifyToken(token:string):JWTPayload{
    return jwt.verify(token,env.JWT_SECRET) as JWTPayload
}