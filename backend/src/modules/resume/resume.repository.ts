import { isValidObjectId, type QueryFilter } from "mongoose";
import { ResumeModel, type ResumeDocument } from "./resume.model.js";
import type { UploadResumeInput } from "./resume.schema.js";
import type { Resume } from "./resume.types.js";

export type ResumeQueryFilter = {
    candidateId?: string;
};

export type FindManyResumesOptions = {
    page?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
};

class ResumeRepository {
    async createMany(input: UploadResumeInput): Promise<ResumeDocument[]> {
        const resumes = input.documents.map((document) => ({
            candidateId: input.candidateId,
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
        filter: ResumeQueryFilter = {},
        options: FindManyResumesOptions = {},
    ): Promise<{ items: ResumeDocument[]; total: number }> {
        const query: QueryFilter<Resume> = {};

        if (filter.candidateId) {
            query.candidateId = filter.candidateId;
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
}

export const resumeRepository = new ResumeRepository();
