/**
 * AppError — errors we throw on purpose from this application.
 *
 * Why this exists:
 * A plain `throw new Error("Candidate not found")` only carries a message.
 * HTTP APIs also need a status code (404 vs 500) so Express middleware can
 * map the failure to the correct response. This class is that shared shape.
 *
 * How it will be used later:
 *   throw new AppError("Candidate not found", 404)
 *   throw new AppError("Invalid resume payload", 400)
 *
 * An error-handling middleware (not in this file) should then do:
 *   if (err instanceof AppError) {
 *     return res.status(err.statusCode).json({ message: err.message })
 *   }
 * Unknown errors (bugs, Mongo crashes, RAG pipeline failures) stay 500
 * and get logged, instead of leaking internals to the client.
 */
export class AppError extends Error {
    /** HTTP status to send when this error reaches the API layer. */
    public readonly statusCode: number

    /**
     * true  = expected business failure (missing candidate, bad input).
     *         Safe to show `message` to the client.
     * false = programmer/infrastructure bug. Log it; hide details in production.
     */
    public readonly isOperational: boolean

    constructor(
        message: string,
        statusCode = 500,
        isOperational = true,
    ) {
        // Pass the message into the built-in Error (sets err.message and the stack).
        super(message)

        // Makes logs and `instanceof` checks read "AppError", not generic "Error".
        this.name = "AppError"
        this.statusCode = statusCode
        this.isOperational = isOperational

        // TypeScript/ES subclasses of Error can lose their prototype in some
        // runtimes. This keeps `err instanceof AppError` reliable.
        Object.setPrototypeOf(this, new.target.prototype)

        // Starts the stack trace at the `throw` site, not inside this constructor.
        Error.captureStackTrace(this, this.constructor)
    }
}
