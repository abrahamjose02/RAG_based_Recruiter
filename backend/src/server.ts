import type { Server } from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connnectDB,disconnectDB } from "./config/database.js";
import { logger } from "./utils/logger.js";

let server: Server | undefined

// Infrastructure should be starting the correct order
// MongoDB and then the http server

async function bootstrap():Promise<void> {
    try {
        await connnectDB()
        server = app.listen(env.PORT,()=>{
            logger.info(`API running on ${env.PORT}`)

            logger.info(`Health Check : http://localhost:${env.PORT}/api/v1/health`)
        })
    } catch (error) {
        logger.error("Application startup failed",error)
        process.exit(1)
    }
}


//When the operating system asks our service to terminate,
//we first stop accepting new HTTP requests and then we shutdown the database connections.

async function shutdown(signal:string):Promise<void>{
    logger.info(`${signal} recieved. Starting graceful shutdown.`)

    try {
        if(server){
            await new Promise<void>((resolve,reject)=>{
                server?.close((error)=>{
                    if(error){
                        reject(error)
                        return;
                    }
                    resolve()
                })
            })
        }
        await disconnectDB()
        logger.info("Application shut down successfully")
        process.exit(0)
    } catch (error) {
        logger.error("Graceful shutdown failed.",error)
        process.exit(1)
    }
}

process.on("SIGTERM",()=>{
    void shutdown("SIGTERM") // This is what , the Docker and Systemd or a host send when it wants the app to stop.
})

// These two lines of process will listen to the please stop signals from the OS

process.on("SIGINT",()=>{
    void shutdown("SIGINT")
})

// This function is fired or called when a Promise rejects and nothing awaits or .catches it.
process.on("unhandledRejection",(reason)=>{
    logger.error("Unhandled promise rejection.",reason)
})

//This function is called or fired 
process.on("uncaughtException",(error)=>{
    logger.error("Uncaught exception",error)

    void shutdown("uncaughtException")
})

void bootstrap()