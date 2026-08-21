import { getDatabaseStatus } from "../../config/database.js";

export function getHealthStatus(){
    const database = getDatabaseStatus()

    return{
        status:database.connected ? "ok":"degraded",
        timestamp: new Date().toISOString(),
        services:{
            database:{
                status:database.connected ? "connected":"disconnected"
            }
        }
    }
}