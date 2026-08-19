//centralized logger

export const logger = {
    info(message:string,...meta:unknown[]):void{
        console.info(`[info] ${message} `,...meta)
    },
    warn(message:string,...meta:unknown[]):void{
        console.warn(`[warn] ${message}`,...meta)
    },
    error(message:string,...meta:unknown[]):void{
        console.error(`[Error] ${message}`,...meta)
    }
}

//exmple usage : 

// logger.info("Server listening", { port: 5000 })
// // [info] Server listening  { port: 5000 }

// logger.error("Failed to embed resume", err)
// // [Error] Failed to embed resume  <Error>