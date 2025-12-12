import { api } from "encore.dev/api";
import { photoBucket } from "./storage";
import db from "../db";
import { randomUUID } from "crypto";

export interface UploadPhotoRequest {
  filename: string;
  mimeType: string;
  data: string; // base64 encoded
  caption?: string;
  customerId?: number;
  estimateId?: number;
  invoiceId?: number;
}

export interface Photo {
  id: number;
  url: string;
  storageKey: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  caption: string | null;
  customerId: number | null;
  estimateId: number | null;
  invoiceId: number | null;
  sortOrder: number;
  createdAt: Date;
}

// Upload a photo and associate it with a customer, estimate, or invoice
export const upload = api<UploadPhotoRequest, Photo>(
  { expose: true, method: "POST", path: "/photos/upload" },
  async (req) => {
    // Validate that at least one parent is specified
    if (!req.customerId && !req.estimateId && !req.invoiceId) {
      throw new Error("Must specify customerId, estimateId, or invoiceId");
    }

    // Decode base64 data
    const buffer = Buffer.from(req.data, "base64");
    const fileSize = buffer.length;

    // Validate file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error("File size exceeds 10MB limit");
    }

    // Validate mime type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(req.mimeType)) {
      throw new Error(`Invalid mime type. Allowed: ${allowedTypes.join(", ")}`);
    }

    // Generate storage key
    const ext = req.mimeType.split("/")[1];
    const storageKey = `${randomUUID()}.${ext}`;

    // Upload to object storage
    await photoBucket.upload(storageKey, buffer, {
      contentType: req.mimeType,
    });

    // Get public URL
    const url = await photoBucket.publicUrl(storageKey);

    // Save to database
    const row = await db.queryRow<{
      id: number;
      url: string;
      storage_key: string;
      filename: string;
      mime_type: string;
      file_size: number;
      caption: string | null;
      customer_id: number | null;
      estimate_id: number | null;
      invoice_id: number | null;
      sort_order: number;
      created_at: Date;
    }>`
      INSERT INTO photos (
        url, storage_key, filename, mime_type, file_size, caption,
        customer_id, estimate_id, invoice_id, sort_order
      )
      VALUES (
        ${url}, ${storageKey}, ${req.filename}, ${req.mimeType}, ${fileSize}, ${req.caption ?? null},
        ${req.customerId ?? null}, ${req.estimateId ?? null}, ${req.invoiceId ?? null}, 0
      )
      RETURNING id, url, storage_key, filename, mime_type, file_size, caption,
                customer_id, estimate_id, invoice_id, sort_order, created_at
    `;

    if (!row) {
      throw new Error("Failed to save photo");
    }

    return {
      id: row.id,
      url: row.url,
      storageKey: row.storage_key,
      filename: row.filename,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      caption: row.caption,
      customerId: row.customer_id,
      estimateId: row.estimate_id,
      invoiceId: row.invoice_id,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    };
  }
);
