import type { SearchResponse } from "./types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

export async function searchResumes(query:string):Promise<SearchResponse>{
    const response = await fetch(`${apiUrl}/api/v1/search`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({query})
    });

    const body = (await response.json()) as {
        success:boolean;
        data?:SearchResponse;
        error?:{message:string};
    };

    if(!response.ok || !body.success || !body.data){
        throw new Error(body.error?.message ?? "Failed to search resumes");
    }

    return body.data;
}