import { v2 as cloudinary } from "cloudinary";

const rawUrl = (process.env.CLOUDINARY_URL ?? "").replace(/<([^>]+)>/g, "$1");

// Configured = URL starts with cloudinary:// and has an @ (cloud_name)
const configured =
  rawUrl.startsWith("cloudinary://") &&
  rawUrl.includes("@") &&
  !rawUrl.includes("api_key:api_secret"); // placeholder non remplacé

if (configured) {
  cloudinary.config({ cloudinary_url: rawUrl });
}

/**
 * Upload un fichier vers Cloudinary.
 * Retourne l'URL sécurisée, ou null si Cloudinary n'est pas configuré
 * (permet la création de boutique/produit sans image en prod).
 */
export async function uploadMedia(
  file: File,
  folder = "bizmanager/products",
): Promise<string | null> {
  if (!configured) return null;

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
