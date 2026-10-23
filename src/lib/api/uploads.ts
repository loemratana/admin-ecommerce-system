import api from "@/lib/api/client";

// Uploads to Cloudinary via POST /api/v1/images (admin only); `folder` is the Cloudinary folder.
// Content-Type must be overridden - the client defaults to JSON, which would serialize the FormData.
export function uploadImage(file: File, folder: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("name", folder);
  return api.post<{ url: string }>("/api/v1/images", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
