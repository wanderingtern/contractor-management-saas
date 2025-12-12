import { api } from "encore.dev/api";
import { photoBucket } from "./storage";
import db from "../db";

export interface DeletePhotoRequest {
  id: number;
}

export interface DeletePhotoResponse {
  success: boolean;
}

// Delete a photo from storage and database
export const deletePhoto = api<DeletePhotoRequest, DeletePhotoResponse>(
  { expose: true, method: "DELETE", path: "/photos/:id" },
  async (req) => {
    // Get photo from database
    const photo = await db.queryRow<{
      storage_key: string;
    }>`
      SELECT storage_key
      FROM photos
      WHERE id = ${req.id}
    `;

    if (!photo) {
      throw new Error("Photo not found");
    }

    // Delete from object storage
    await photoBucket.remove(photo.storage_key);

    // Delete from database
    await db.exec`
      DELETE FROM photos
      WHERE id = ${req.id}
    `;

    return { success: true };
  }
);
