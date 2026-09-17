import { isValidObjectId, type QueryFilter } from "mongoose";
import { ResumeModel, type ResumeDocument } from "./resume.model";
import type { UploadResumeInput } from "./resume.schema";
import type { ParsedResumeResult, Resume, ResumeStatus } from "./resume.types";

export type ResumeQueryFilter = {
    organizationId:string;
    recruiterId?:string | undefined;
    candidateId?: string | undefined;
};

export type FindManyResumesOptions = {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
};

export type CreateResumeRecordInput = UploadResumeInput & {
    organizationId:string;
    recruiterId:string
}
class ResumeRepository {
    async createMany(input: CreateResumeRecordInput): Promise<ResumeDocument[]> {
        const resumes = input.documents.map((document) => ({
            organizationId:input.organizationId,
            recruiterId:input.recruiterId,
            candidateId: input.candidateId,
            ...(input.candidateId ? {candidateId:input.candidateId} : {}),
            clientDocumentId: document.clientDocumentId,
            originalFilename: document.file.name,
            storageKey: document.storage.key,
            mimeType: document.file.mimeType,
            sizeBytes: document.file.size,
            extractedText: document.extractedText,
            status: "uploaded" as const,
        }));

        return ResumeModel.insertMany(resumes, { ordered: true });
    }

    async findById(id: string): Promise<ResumeDocument | null> {
        if (!isValidObjectId(id)) {
            return null;
        }

        return ResumeModel.findById(id);
    }

    async findMany(
        filter: ResumeQueryFilter,
        options: FindManyResumesOptions = {},
    ): Promise<{ items: ResumeDocument[]; total: number }> {
        const query: QueryFilter<Resume> = {
            organizationId : filter.organizationId
        };

        if (filter.candidateId) {
            query.candidateId = filter.candidateId;
        }
        
        if(filter.recruiterId){
            query.recruiterId = filter.recruiterId
        }

        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const skip = (page - 1) * limit;
        const sort = options.sort ?? { createdAt: -1 };

        const [items, total] = await Promise.all([
            ResumeModel.find(query).sort(sort).skip(skip).limit(limit),
            ResumeModel.countDocuments(query),
        ]);

        return { items, total };
    }

    async updateStatus(id:string,status:ResumeStatus,extra:{parsed?:ParsedResumeResult;errorMessage?: string | null} = {}):Promise<ResumeDocument | null>{
        return ResumeModel.findByIdAndUpdate(id,
            {
                $set:{
                    status,
                    ...(extra.parsed? { parsed : extra.parsed } : {}),
                    ...(extra.errorMessage !== undefined ? {errorMessage:extra.errorMessage} : {}),
                },
            },
            {new : true}
        )
    }

    async attachCandidate(id:string,candidateId:string):Promise<ResumeDocument | null >{
        return ResumeModel.findByIdAndUpdate(
            id,
            {$set:{candidateId,status:"parsed"}},
            {new : true},
        );
    }
}

export const resumeRepository = new ResumeRepository();
