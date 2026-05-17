import { v2 as cloudinary } from "cloudinary";

// Le dashboard Cloudinary affiche parfois l'URL avec des <> — on les retire
const cloudinaryUrl = (process.env.CLOUDINARY_URL ?? "").replace(/<([^>]+)>/g, "$1");
cloudinary.config({ cloudinary_url: cloudinaryUrl });

export async function uploadMedia(
  file: File,
  folder = "bizmanager/products",
): Promise<string> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Le fichier doit être une image ou une vidéo");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Media trop volumineux (max 20 MB)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: resourceType }, (error, result) => {
        if (error) reject(new Error(error.message));
        else if (!result) reject(new Error("Upload Cloudinary échoué"));
        else resolve(result.secure_url);
      })
      .end(buffer);
  });
}
