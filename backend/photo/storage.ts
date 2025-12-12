import { Bucket } from "encore.dev/storage/objects";

// Create an object storage bucket for photos
export const photoBucket = new Bucket("photos", {
  versioned: false,
  public: true,
});
