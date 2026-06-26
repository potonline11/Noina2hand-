import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import AdmZip from "adm-zip";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json());

  // Serve API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google Sheets API proxy endpoints
  app.post("/api/sheets/metadata", async (req, res) => {
    const { spreadsheetId, accessToken } = req.body;
    if (!spreadsheetId || !accessToken) {
      return res.status(400).json({ error: "Missing spreadsheetId or accessToken" });
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ 
          error: errorData.error?.message || `ไม่สามารถเข้าถึง Google Sheet ดึงข้อมูลไม่สำเร็จ (${response.status})` 
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Backend sheets metadata error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sheets/init", async (req, res) => {
    const { spreadsheetId, accessToken, defaultProducts } = req.body;
    if (!spreadsheetId || !accessToken) {
      return res.status(400).json({ error: "Missing spreadsheetId or accessToken" });
    }

    try {
      // Fetch current sheet tabs
      const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
      const metaRes = await fetch(metaUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!metaRes.ok) {
        const errorData = await metaRes.json().catch(() => ({}));
        return res.status(metaRes.status).json({ 
          error: errorData.error?.message || "ดึงข้อมูลสเปรดชีตไม่สำเร็จระหว่างสร้างตารางแม่แบบ" 
        });
      }
      const meta = await metaRes.json();
      const sheets = meta.sheets || [];
      const existingTitles = sheets.map((s: any) => s.properties.title);

      const requests: any[] = [];
      if (!existingTitles.includes('Products')) {
        requests.push({
          addSheet: {
            properties: {
              title: 'Products',
              gridProperties: { rowCount: 100, columnCount: 10 }
            }
          }
        });
      }

      if (!existingTitles.includes('Orders')) {
        requests.push({
          addSheet: {
            properties: {
              title: 'Orders',
              gridProperties: { rowCount: 1000, columnCount: 15 }
            }
          }
        });
      }

      if (requests.length > 0) {
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
        const updateRes = await fetch(updateUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });
        if (!updateRes.ok) {
          return res.status(updateRes.status).json({ error: 'ไม่สามารถเพิ่มแท็บแผ่นงาน Products / Orders ใหม่ใน Google Sheet ได้' });
        }
      }

      // Populate headers and data
      const productsHeaders = [['ID', 'ชื่อสินค้า (Name)', 'แบรนด์ (Brand)', 'ราคา (Price)', 'คะแนน BV (BV)', 'ไอคอนภาพ (Image)', 'สีการ์ด (Color)']];
      const productsRows = (defaultProducts || []).map((p: any) => [
        p.id,
        p.name,
        p.brand,
        p.price,
        p.bv,
        p.image || '📱',
        p.color || 'from-slate-700 to-slate-900'
      ]);

      const updateValuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
      const dataUpdates = [
        {
          range: 'Products!A1:G100',
          values: [...productsHeaders, ...productsRows]
        },
        {
          range: 'Orders!A1:J1',
          values: [['Order ID', 'วันเวลา (Timestamp)', 'รหัสลูกค้า (Member ID)', 'ชื่อลูกค้า (Customer Name)', 'สินค้าที่สั่ง (Product)', 'จำนวนที่สั่ง (Quantity)', 'ราคาต่อชิ้น (Price)', 'ราคารวม (Total Price)', 'คะแนน BV รวม (Total BV)', 'ผู้แนะนำ / สปอนเซอร์ (Sponsor)']]
        }
      ];

      const valuesRes = await fetch(updateValuesUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: dataUpdates
        })
      });

      if (!valuesRes.ok) {
        return res.status(valuesRes.status).json({ error: 'ไม่สามารถตั้งค่าคอลัมน์มาตรฐานให้กับชีตได้' });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Backend sheets init error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sheets/pull-products", async (req, res) => {
    const { spreadsheetId, accessToken } = req.body;
    if (!spreadsheetId || !accessToken) {
      return res.status(400).json({ error: "Missing spreadsheetId or accessToken" });
    }

    try {
      const range = 'Products!A2:G200';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 400) {
          return res.status(400).json({ error: 'ไม่พบแผ่นงานชื่อ "Products" ใน Google Sheet นี้ กรุณารันปุ่มสร้างตารางมาตรฐานก่อน' });
        }
        return res.status(response.status).json({ error: 'ไม่สามารถดึงข้อมูลสินค้าจากช่องตาราง Products ได้' });
      }

      const data = await response.json();
      const rows = data.values || [];

      const parsedProducts = rows.map((row: any, index: number) => {
        const id = row[0] || `p-sheet-${index + 1}`;
        const name = row[1] || 'สินค้าไม่มีชื่อ';
        const brand = row[2] || '';
        const price = Math.max(0, parseInt(row[3]) || 0);
        const bv = Math.max(0, parseInt(row[4]) || Math.round(price * 0.01));
        const image = row[5] || '📦';
        const color = row[6] || 'from-slate-700 to-slate-900';

        return { id, name, brand, price, bv, image, color };
      });

      res.json({ products: parsedProducts });
    } catch (error: any) {
      console.error("Backend pull products error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sheets/append-order", async (req, res) => {
    const { spreadsheetId, accessToken, tx, seller, product, quantity } = req.body;
    if (!spreadsheetId || !accessToken || !tx || !seller || !product || !quantity) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      const range = 'Orders!A:J';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

      const totalAmount = product.price * quantity;
      const totalBV = product.bv * quantity;
      const sponsorName = seller.sponsorId || 'ไม่มีผู้แนะนำ';

      const row = [
        tx.id,
        tx.timestamp,
        seller.id,
        seller.name,
        product.name,
        quantity,
        product.price,
        totalAmount,
        totalBV,
        sponsorName
      ];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row]
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Backend append order failed:', text);
        return res.status(response.status).json({ error: 'Failed to append order to Google Sheet', details: text });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Backend append order error:", error);
      res.status(500).json({ error: error.message });
    }
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
