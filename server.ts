import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import AdmZip from "adm-zip";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ZIP Download API
  app.get("/api/download-zip", (req, res) => {
    try {
      const zip = new AdmZip();
      const baseDir = process.cwd();
      
      function addFilesRecursively(dir: string, baseDir: string, zip: AdmZip) {
        const list = fs.readdirSync(dir);
        for (const file of list) {
          if (['node_modules', 'dist', '.git', '.npm', '.cache', 'tmp', '.cursor', 'test-output.zip', 'test-output-old.zip'].includes(file)) {
            continue;
          }
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          const relativePath = path.relative(baseDir, fullPath);
          
          if (stat.isDirectory()) {
            addFilesRecursively(fullPath, baseDir, zip);
          } else {
            const zipPath = relativePath.replace(/\\/g, '/');
            const data = fs.readFileSync(fullPath);
            zip.addFile(zipPath, data);
          }
        }
      }
      
      addFilesRecursively(baseDir, baseDir, zip);
      const zipBuffer = zip.toBuffer();
      
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="phonetwork-source.zip"');
      res.send(zipBuffer);
    } catch (error: any) {
      console.error("Error creating ZIP:", error);
      res.status(500).json({ error: "Failed to generate ZIP file", details: error.message });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
