export class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number
    ) {
      super(message)
      this.name = "ApiError"
    }
  }
  
  type Envelope<T> = {
    success: boolean
    data?: T
    error?: { message: string }
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
  
  type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    body?: unknown
    token?: string | null
    query?: Record<string, string | number | boolean | undefined>
  }
  
  export async function api<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = new URL(`${apiUrl}${path}`)
  
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value))
      }
    }
  
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token
          ? { Authorization: `Bearer ${options.token}` }
          : {}),
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  
    const body = (await response.json()) as Envelope<T>
  
    if (!response.ok || !body.success || body.data === undefined) {
      throw new ApiError(body.error?.message ?? "Request failed", response.status)
    }
  
    return body.data
  }