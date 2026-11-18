import { api } from "./api"
import type { ResumeList, ResumeRecord } from "./types"

type ResumeDocument = Omit<ResumeRecord, "id"> & { _id: string }

function toResume(document: ResumeDocument): ResumeRecord {
  const { _id, ...rest } = document
  return { id: _id, ...rest }
}

export function listResumes(page: number, token: string) {
  return api<{ items: ResumeDocument[]; total: number }>("/api/v1/resumes", {
    token,
    query: { page, limit: 20, mine: true },
  }).then(
    (data): ResumeList => ({
      items: data.items.map(toResume),
      total: data.total,
    })
  )
}

export function uploadResumeManifest(
  input: {
    organizationId: string
    fileName: string
    mimeType:
      | "application/pdf"
      | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    size: number
    extractedText: string
  },
  token: string
) {
  const extension = input.mimeType === "application/pdf" ? "pdf" : "docx"

  return api<ResumeDocument[]>("/api/v1/resumes", {
    method: "POST",
    token,
    body: {
      documents: [
        {
          clientDocumentId: crypto.randomUUID(),
          file: {
            name: input.fileName,
            mimeType: input.mimeType,
            size: input.size,
          },
          storage: {
            key: `organizations/${input.organizationId}/resumes/${crypto.randomUUID()}/original.${extension}`,
          },
          extractedText: input.extractedText,
        },
      ],
    },
  })
}