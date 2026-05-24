import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./config";

export const uploadProjectFile = async (projectId: string, file: File): Promise<{ url: string; name: string }> => {
  const timestamp = Date.now();
  const storageRef = ref(storage, `projects/${projectId}/${timestamp}_${file.name}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  
  return {
    url,
    name: file.name
  };
};

export const deleteProjectFile = async (fileUrl: string) => {
  // Extract path from URL if needed, but getDownloadURL usually provides the full reference
  // Firebase storage reference can be created from URL
  const storageRef = ref(storage, fileUrl);
  await deleteObject(storageRef);
};
