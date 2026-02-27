import { MaterialType } from '../enums';

/**
 * MaterialResponse — what the API returns to the frontend
 *
 * WHY A SEPARATE TYPE?
 *   The entity has private fields, ObjectIds, internal methods.
 *   The response has plain strings, no methods, only data the
 *   frontend cares about. toResponse() produces this shape.
 *
 * SAME PATTERN AS: UserResponse in users/domain/types/user.types.ts
 */
export interface MaterialResponse {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  subject: string;
  topic: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  originalName?: string;
  uploadedBy: string;
  assignedTo: string[];
  assignedCount: number;
  courseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MaterialFilterOptions — query parameters for search + filter
 *
 * Used by GetAllMaterialsQuery to pass filter criteria
 * to the repository. The repository translates these
 * into MongoDB query operators.
 */
export interface MaterialFilterOptions {
  search?: string; // text search on title + topic
  subject?: string; // exact match on subject
}
