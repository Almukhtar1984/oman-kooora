export const getImageUrl = (imageName: string | null | undefined) => {
    if (!imageName) return "";
    
    const fileName = imageName.startsWith("http") 
        ? imageName.split("/").pop() 
        : imageName;

    // Use the local API (NEXT_PUBLIC_API_URL) as the primary entry point.
    // The backend is configured to automatically redirect to production 
    // (api.omkooora.com) if the image is not found in the local uploads folder.
    if (process.env.NEXT_PUBLIC_API_URL) {
        return `${process.env.NEXT_PUBLIC_API_URL}/images/${fileName}`;
    }
    
    return `${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${fileName}`;
};
