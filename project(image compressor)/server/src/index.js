import express from "express";
import cors from "cors";
import multer from "multer";
import { compressImage, decompressImage, estimateCompression, optimizeImage } from "./utils/imageCodec.js";

const app = express();
const PORT = process.env.PORT || 5000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "huffman-image-compressor", date: new Date().toISOString() });
});

app.post("/api/estimate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file." });
    }

    const config = {
      mode: req.body.mode,
      colorMode: req.body.colorMode,
      targetType: req.body.targetType,
      targetValue: req.body.targetValue,
      quality: req.body.quality
    };

    const estimate = await estimateCompression(req.file.buffer, config);
    return res.json(estimate);
  } catch (error) {
    return res.status(500).json({
      message: "Compression estimate failed",
      error: error.message
    });
  }
});

app.post("/api/compress", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file." });
    }

    const config = {
      mode: req.body.mode,
      colorMode: req.body.colorMode,
      targetType: req.body.targetType,
      targetValue: req.body.targetValue,
      quality: req.body.quality
    };

    const {
      header,
      compressedFileBuffer,
      stats,
      analysis,
      controlsApplied
    } = await compressImage(req.file.buffer, config);

    return res.json({
      header,
      stats,
      analysis,
      controlsApplied,
      compressedFileName: `${Date.now()}_compressed.huffimg`,
      compressedBase64: compressedFileBuffer.toString("base64")
    });
  } catch (error) {
    return res.status(500).json({
      message: "Compression failed",
      error: error.message
    });
  }
});

app.post("/api/decompress", async (req, res) => {
  try {
    const { compressedBase64 } = req.body;

    if (!compressedBase64) {
      return res.status(400).json({ message: "compressedBase64 is required." });
    }

    const compressedBuffer = Buffer.from(compressedBase64, "base64");
    const { header, outputBuffer, stats, mimeType } = await decompressImage(compressedBuffer);

    return res.json({
      header,
      stats,
      mimeType,
      reconstructedImageBase64: outputBuffer.toString("base64")
    });
  } catch (error) {
    return res.status(500).json({
      message: "Decompression failed",
      error: error.message
    });
  }
});

app.post("/api/optimize", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image file." });
    }

    const format = req.body.format || "webp";
    const quality = req.body.quality || 70;
    const { optimizedBuffer, stats } = await optimizeImage(req.file.buffer, format, quality);

    const extension = stats.format === "jpeg" ? "jpg" : "webp";
    return res.json({
      stats,
      fileName: `${Date.now()}_optimized.${extension}`,
      optimizedImageBase64: optimizedBuffer.toString("base64"),
      mimeType: stats.format === "jpeg" ? "image/jpeg" : "image/webp"
    });
  } catch (error) {
    return res.status(500).json({
      message: "Image optimization failed",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  // This startup log helps beginners confirm the API is running.
  console.log(`Server running on http://localhost:${PORT}`);
});
