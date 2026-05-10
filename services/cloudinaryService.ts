
export const uploadToCloudinary = async (base64: string): Promise<string> => {
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 })
    });
    const data = await response.json();
    return data.url || '';
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return '';
  }
};
