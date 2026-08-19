import mongoose from "mongoose"
import { env } from "./env.js"
import { logger } from "../utils/logger.js"


export async function connnectDB(): Promise<void>{
    try {
        await mongoose.connect(env.MONGODB_URI)
        logger.info("MongoDB connected Successfully")
    } catch (error) {
        logger.error("MongoDB connection failed")
        throw error
    }
}

//Graceful shutdown of a Mongodb connection

export async function disconnectDB():Promise<void>{
   await mongoose.disconnect()
}

export function getDatabaseStatus():{
    connected:boolean,
    state:number
}{
    const state = mongoose.connection.readyState
    return {
        connected : state === 1, // mongodb readyState :  0 - disconnected , 1- connected , 2- connecting , 3-disconnecting
        state
    }
}