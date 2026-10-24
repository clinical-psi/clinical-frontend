import imageCompression from "browser-image-compression";

export async function compressAvatarImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  };
  return await imageCompression(file, options);
}
