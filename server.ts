import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v2 as cloudinary } from 'cloudinary';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cloudinary Config
  const isCloudinaryConfigured = process.env.VITE_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  
  if (!isCloudinaryConfigured) {
    console.warn("WARNING: Cloudinary credentials missing in environment variables. Image uploads will fail.");
  }

  cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/upload", async (req, res) => {
    try {
      const { image, folder } = req.body;
      if (!image) return res.status(400).json({ error: "Missing image data" });

      const uploadResponse = await cloudinary.uploader.upload(`data:image/png;base64,${image}`, {
        folder: folder || "presentations",
      });

      res.json({ url: uploadResponse.secure_url });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
