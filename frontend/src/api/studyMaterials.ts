import { api } from "./axios";

export interface StudyMaterial {
  _id: string;
  title: string;
  description: string;
  subject: string;
  section: string;
  fileUrl: string;
  uploaderRole: "student" | "teacher";
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface StudyMaterialResponse {
  materials: StudyMaterial[];
  currentPage: number;
  totalPages: number;
  totalMaterials: number;
}

export const StudyMaterialsApi = {
  list: (params?: {
    subject?: string;
    section?: string;
    page?: number;
    limit?: number;
  }) => api.get<StudyMaterialResponse>("/materials", { params }),

  upload: (payload: {
    title: string;
    description?: string;
    subject: string;
    section: string;
    fileUrl: string;
  }) => api.post<StudyMaterial>("/materials", payload),

  uploadFile: (formData: FormData) =>
    api.post<StudyMaterial>("/materials/upload-file", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),

  remove: (id: string) =>
    api.delete<{ message: string }>(`/materials/${id}`)
};

