import sharp from "sharp";
import { performance } from "node:perf_hooks";
import {
  buildFrequencyMap,
  buildHuffmanTree,
  computeEncodedBitStats,
  decodeData,
  encodeData,
  generateCodes,
  getCodeLengthDistribution,
  serializeTree
} from "./huffman.js";

const MAGIC_HEADER = "HUFIMG3";
const LEGACY_MAGIC_V2 = "HUFIMG2";
const LEGACY_MAGIC_V1 = "HUFIMG1";

const METHOD_HUFFMAN_PIXELS = 0;
const METHOD_STORED_IMAGE = 1;

const COLOR_MODE_MAP = {
  rgb: 0,
  grayscale: 1
};

const REVERSE_COLOR_MODE_MAP = {
  0: "rgb",
  1: "grayscale"
};

const IMAGE_FORMAT_ID = {
  png: 0,
  jpeg: 1,
  webp: 2
};

const REVERSE_IMAGE_FORMAT_ID = {
  0: "png",
  1: "jpeg",
  2: "webp"
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatToMime(format) {
  if (format === "jpeg") {
    return "image/jpeg";
  }
  if (format === "webp") {
    return "image/webp";
  }
  return "image/png";
}

function parseCompressionConfig(rawConfig = {}, originalBytes = 0) {
  const mode = rawConfig.mode === "lossy" ? "lossy" : "lossless";
  const colorMode = rawConfig.colorMode === "grayscale" ? "grayscale" : "rgb";

  const targetType = ["percentage", "size", "quality"].includes(rawConfig.targetType)
    ? rawConfig.targetType
    : "quality";

  const targetValue = Number(rawConfig.targetValue);
  const qualityInput = Number(rawConfig.quality);
  let quality = Number.isFinite(qualityInput) ? clamp(Math.round(qualityInput), 5, 100) : 75;

  let targetBytes = null;
  if (targetType === "percentage" && Number.isFinite(targetValue)) {
    const clampedPercent = clamp(targetValue, 1, 95);
    targetBytes = Math.max(1, Math.floor(originalBytes * (1 - (clampedPercent / 100))));
    quality = clamp(Math.round(100 - (clampedPercent * 0.8)), 5, 100);
  }

  if (targetType === "size" && Number.isFinite(targetValue)) {
    targetBytes = Math.max(1, Math.floor(targetValue * 1024));
    const ratio = originalBytes > 0 ? targetBytes / originalBytes : 1;
    quality = clamp(Math.round(ratio * 100), 5, 100);
  }

  if (targetType === "quality" && Number.isFinite(targetValue)) {
    quality = clamp(Math.round(targetValue), 5, 100);
  }

  return {
    mode,
    colorMode,
    targetType,
    targetValue: Number.isFinite(targetValue) ? targetValue : quality,
    quality,
    targetBytes
  };
}

function derivePreprocessProfile(config) {
  const q = config.quality;

  if (config.mode === "lossless") {
    return {
      quantizationLevels: 256,
      forceGrayscale: config.colorMode === "grayscale",
      dropAlpha: false,
      resizeScale: 1,
      blurSigma: 0
    };
  }

  const quantizationLevels = q >= 90 ? 256
    : q >= 75 ? 128
      : q >= 60 ? 64
        : q >= 45 ? 32
          : 16;

  return {
    quantizationLevels,
    forceGrayscale: config.colorMode === "grayscale" || q <= 35,
    dropAlpha: q <= 55,
    resizeScale: q <= 40 ? 0.85 : 1,
    blurSigma: q <= 35 ? 0.45 : 0
  };
}

function quantizePixels(pixelBuffer, channels, levels) {
  if (levels >= 256) {
    return pixelBuffer;
  }

  const output = Buffer.from(pixelBuffer);
  const bucketSize = 256 / levels;

  for (let i = 0; i < output.length; i += 1) {
    if (channels === 4 && (i + 1) % 4 === 0) {
      continue;
    }

    const original = output[i];
    const bucket = Math.floor(original / bucketSize);
    const quantized = Math.round((bucket * bucketSize) + (bucketSize / 2));
    output[i] = clamp(quantized, 0, 255);
  }

  return output;
}

async function extractPixelData(inputBuffer, preprocessProfile) {
  let pipeline = sharp(inputBuffer, { failOnError: false });

  const metadata = await pipeline.metadata();

  if (preprocessProfile.forceGrayscale) {
    pipeline = pipeline.grayscale();
  }

  if (preprocessProfile.dropAlpha) {
    pipeline = pipeline.removeAlpha();
  }

  if (preprocessProfile.resizeScale < 1 && metadata.width && metadata.height) {
    const nextWidth = Math.max(1, Math.round(metadata.width * preprocessProfile.resizeScale));
    const nextHeight = Math.max(1, Math.round(metadata.height * preprocessProfile.resizeScale));
    pipeline = pipeline.resize({ width: nextWidth, height: nextHeight, fit: "fill" });
  }

  if (preprocessProfile.blurSigma > 0) {
    pipeline = pipeline.blur(preprocessProfile.blurSigma);
  }

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  const quantized = quantizePixels(Buffer.from(data), info.channels, preprocessProfile.quantizationLevels);

  return {
    pixels: quantized,
    width: info.width,
    height: info.height,
    channels: info.channels
  };
}

function buildFrequencyTable(frequencies, codes) {
  return frequencies
    .map((frequency, value) => ({
      value,
      frequency,
      code: codes[value] || "",
      bitLength: codes[value] ? codes[value].length : 0
    }))
    .filter((entry) => entry.frequency > 0)
    .sort((a, b) => b.frequency - a.frequency);
}

function packHuffmanContainer(header, encodedData) {
  const symbols = [];

  for (let value = 0; value < 256; value += 1) {
    const frequency = header.frequencies[value] || 0;
    if (frequency > 0) {
      symbols.push({ value, frequency });
    }
  }

  const huffmanHeaderSize = 4 + 4 + 1 + 1 + 4 + 1 + 2 + (symbols.length * 5);
  const fixedSize = MAGIC_HEADER.length + 1 + 1 + 2;
  const headerBuffer = Buffer.alloc(fixedSize + huffmanHeaderSize);

  let offset = 0;
  offset += headerBuffer.write(MAGIC_HEADER, offset, "utf-8");
  headerBuffer.writeUInt8(1, offset);
  offset += 1;
  headerBuffer.writeUInt8(METHOD_HUFFMAN_PIXELS, offset);
  offset += 1;
  headerBuffer.writeUInt16BE(huffmanHeaderSize, offset);
  offset += 2;

  headerBuffer.writeUInt32BE(header.width, offset);
  offset += 4;
  headerBuffer.writeUInt32BE(header.height, offset);
  offset += 4;
  headerBuffer.writeUInt8(header.channels, offset);
  offset += 1;
  headerBuffer.writeUInt8(COLOR_MODE_MAP[header.colorMode] ?? 0, offset);
  offset += 1;
  headerBuffer.writeUInt32BE(header.bitLength, offset);
  offset += 4;
  headerBuffer.writeUInt8(header.padding, offset);
  offset += 1;
  headerBuffer.writeUInt16BE(symbols.length, offset);
  offset += 2;

  for (let i = 0; i < symbols.length; i += 1) {
    headerBuffer.writeUInt8(symbols[i].value, offset);
    offset += 1;
    headerBuffer.writeUInt32BE(symbols[i].frequency, offset);
    offset += 4;
  }

  return Buffer.concat([headerBuffer, encodedData]);
}

function packStoredImageContainer({ format }, payload) {
  const storedHeaderSize = 1;
  const fixedSize = MAGIC_HEADER.length + 1 + 1 + 2;
  const output = Buffer.alloc(fixedSize + storedHeaderSize + payload.length);

  let offset = 0;
  offset += output.write(MAGIC_HEADER, offset, "utf-8");
  output.writeUInt8(1, offset);
  offset += 1;
  output.writeUInt8(METHOD_STORED_IMAGE, offset);
  offset += 1;
  output.writeUInt16BE(storedHeaderSize, offset);
  offset += 2;

  output.writeUInt8(IMAGE_FORMAT_ID[format] ?? IMAGE_FORMAT_ID.png, offset);
  offset += 1;

  payload.copy(output, offset);
  return output;
}

function unpackV3Container(compressedBuffer) {
  let offset = MAGIC_HEADER.length;
  const version = compressedBuffer.readUInt8(offset);
  offset += 1;

  if (version !== 1) {
    throw new Error("Unsupported compressed file version.");
  }

  const method = compressedBuffer.readUInt8(offset);
  offset += 1;
  const methodHeaderLength = compressedBuffer.readUInt16BE(offset);
  offset += 2;

  const methodHeaderStart = offset;
  const methodHeaderEnd = methodHeaderStart + methodHeaderLength;

  if (method === METHOD_HUFFMAN_PIXELS) {
    const width = compressedBuffer.readUInt32BE(offset);
    offset += 4;
    const height = compressedBuffer.readUInt32BE(offset);
    offset += 4;
    const channels = compressedBuffer.readUInt8(offset);
    offset += 1;
    const colorModeId = compressedBuffer.readUInt8(offset);
    offset += 1;
    const bitLength = compressedBuffer.readUInt32BE(offset);
    offset += 4;
    const padding = compressedBuffer.readUInt8(offset);
    offset += 1;
    const symbolCount = compressedBuffer.readUInt16BE(offset);
    offset += 2;

    const frequencies = new Array(256).fill(0);
    for (let i = 0; i < symbolCount; i += 1) {
      const value = compressedBuffer.readUInt8(offset);
      offset += 1;
      const frequency = compressedBuffer.readUInt32BE(offset);
      offset += 4;
      frequencies[value] = frequency;
    }

    const encodedData = compressedBuffer.subarray(methodHeaderEnd);

    return {
      header: {
        version,
        method,
        width,
        height,
        channels,
        colorMode: REVERSE_COLOR_MODE_MAP[colorModeId] || "rgb",
        frequencies,
        padding,
        bitLength
      },
      encodedData
    };
  }

  if (method === METHOD_STORED_IMAGE) {
    const formatId = compressedBuffer.readUInt8(offset);
    offset += 1;
    const payload = compressedBuffer.subarray(methodHeaderEnd);

    return {
      header: {
        version,
        method,
        format: REVERSE_IMAGE_FORMAT_ID[formatId] || "png"
      },
      encodedData: payload
    };
  }

  throw new Error("Unsupported compression method.");
}

function unpackLegacyContainer(compressedBuffer) {
  const modernMagic = compressedBuffer.subarray(0, LEGACY_MAGIC_V2.length).toString("utf-8");
  if (modernMagic === LEGACY_MAGIC_V2) {
    let offset = LEGACY_MAGIC_V2.length;
    const version = compressedBuffer.readUInt8(offset);
    offset += 1;

    const width = compressedBuffer.readUInt32BE(offset);
    offset += 4;
    const height = compressedBuffer.readUInt32BE(offset);
    offset += 4;
    const channels = compressedBuffer.readUInt8(offset);
    offset += 1;
    const colorModeId = compressedBuffer.readUInt8(offset);
    offset += 1;
    const bitLength = compressedBuffer.readUInt32BE(offset);
    offset += 4;
    const padding = compressedBuffer.readUInt8(offset);
    offset += 1;
    const symbolCount = compressedBuffer.readUInt16BE(offset);
    offset += 2;

    const frequencies = new Array(256).fill(0);
    for (let i = 0; i < symbolCount; i += 1) {
      const value = compressedBuffer.readUInt8(offset);
      offset += 1;
      const frequency = compressedBuffer.readUInt32BE(offset);
      offset += 4;
      frequencies[value] = frequency;
    }

    const encodedData = compressedBuffer.subarray(offset);

    return {
      header: {
        version,
        method: METHOD_HUFFMAN_PIXELS,
        width,
        height,
        channels,
        colorMode: REVERSE_COLOR_MODE_MAP[colorModeId] || "rgb",
        frequencies,
        padding,
        bitLength
      },
      encodedData
    };
  }

  const legacyMagic = compressedBuffer.subarray(0, LEGACY_MAGIC_V1.length).toString("utf-8");
  if (legacyMagic !== LEGACY_MAGIC_V1) {
    throw new Error("Invalid compressed file format.");
  }

  const headerLength = compressedBuffer.readUInt32BE(LEGACY_MAGIC_V1.length);
  const headerStart = LEGACY_MAGIC_V1.length + 4;
  const headerEnd = headerStart + headerLength;
  const header = JSON.parse(compressedBuffer.subarray(headerStart, headerEnd).toString("utf-8"));
  const encodedData = compressedBuffer.subarray(headerEnd);

  return {
    header: {
      ...header,
      method: METHOD_HUFFMAN_PIXELS
    },
    encodedData
  };
}

function unpackCompressedFile(compressedBuffer) {
  const magic = compressedBuffer.subarray(0, MAGIC_HEADER.length).toString("utf-8");
  if (magic === MAGIC_HEADER) {
    return unpackV3Container(compressedBuffer);
  }

  return unpackLegacyContainer(compressedBuffer);
}

async function buildHuffmanCandidate(inputBuffer, config) {
  const preprocessProfile = derivePreprocessProfile(config);
  const { pixels, width, height, channels } = await extractPixelData(inputBuffer, preprocessProfile);

  const frequencies = buildFrequencyMap(pixels);
  const { root, mergeSteps } = buildHuffmanTree(frequencies);
  const codes = generateCodes(root);
  const { encoded, padding, bitLength } = encodeData(pixels, codes);

  const header = {
    version: 1,
    width,
    height,
    channels,
    colorMode: preprocessProfile.forceGrayscale ? "grayscale" : "rgb",
    frequencies,
    padding,
    bitLength
  };

  const compressedFileBuffer = packHuffmanContainer(header, encoded);

  const bitStats = computeEncodedBitStats(codes, frequencies, pixels.length);
  const frequencyTable = buildFrequencyTable(frequencies, codes);

  const overheadBytes = compressedFileBuffer.length - encoded.length;

  return {
    strategy: config.mode === "lossy" ? "lossy-huffman" : "lossless-huffman",
    compressedFileBuffer,
    metadata: {
      method: METHOD_HUFFMAN_PIXELS,
      imageFormat: "png",
      decodeToImage: true
    },
    header,
    analysis: {
      uniqueSymbols: frequencyTable.length,
      frequencyTable,
      mergeSteps,
      tree: serializeTree(root),
      codeLengthDistribution: getCodeLengthDistribution(codes, frequencies)
    },
    stats: {
      encodedBitSize: bitStats.encodedBitSize,
      encodedBytes: Math.ceil(bitStats.encodedBitSize / 8),
      metadataBytes: overheadBytes,
      averageBitsPerSymbol: bitStats.averageBitsPerSymbol
    }
  };
}

async function buildStoredCandidate(inputBuffer, config) {
  const format = config.mode === "lossy" ? "webp" : "png";
  const quality = clamp(config.quality, 5, 100);

  let payload;

  if (config.mode === "lossy") {
    payload = await sharp(inputBuffer, { failOnError: false })
      .webp({ quality, effort: 4 })
      .toBuffer();
  } else {
    payload = Buffer.from(inputBuffer);
  }

  const compressedFileBuffer = packStoredImageContainer({ format }, payload);

  return {
    strategy: config.mode === "lossy" ? "lossy-webp-stored" : "stored-original",
    compressedFileBuffer,
    metadata: {
      method: METHOD_STORED_IMAGE,
      imageFormat: format,
      decodeToImage: false
    },
    header: {
      version: 1,
      method: METHOD_STORED_IMAGE,
      format
    },
    analysis: {
      uniqueSymbols: 0,
      frequencyTable: [],
      mergeSteps: [],
      tree: null,
      codeLengthDistribution: []
    },
    stats: {
      encodedBitSize: payload.length * 8,
      encodedBytes: payload.length,
      metadataBytes: compressedFileBuffer.length - payload.length,
      averageBitsPerSymbol: 0
    }
  };
}

function chooseBestCandidate(candidates, targetBytes) {
  if (targetBytes && targetBytes > 0) {
    const withinTarget = candidates
      .filter((candidate) => candidate.compressedFileBuffer.length <= targetBytes)
      .sort((a, b) => a.compressedFileBuffer.length - b.compressedFileBuffer.length);

    if (withinTarget.length > 0) {
      return withinTarget[0];
    }
  }

  return candidates.sort((a, b) => a.compressedFileBuffer.length - b.compressedFileBuffer.length)[0];
}

function buildCompressionResponse({ originalBytes, chosen, elapsedMs, config }) {
  const finalFileBytes = chosen.compressedFileBuffer.length;
  const ratio = finalFileBytes > 0 ? originalBytes / finalFileBytes : 0;
  const reductionPercent = originalBytes > 0 ? (1 - (finalFileBytes / originalBytes)) * 100 : 0;

  return {
    header: {
      ...chosen.header,
      strategy: chosen.strategy,
      mode: config.mode
    },
    compressedFileBuffer: chosen.compressedFileBuffer,
    stats: {
      originalBytes,
      encodedBitSize: chosen.stats.encodedBitSize,
      encodedBytes: chosen.stats.encodedBytes,
      metadataBytes: chosen.stats.metadataBytes,
      finalFileBytes,
      ratio,
      compressionPercent: reductionPercent,
      averageBitsPerSymbol: chosen.stats.averageBitsPerSymbol,
      targetBytes: config.targetBytes,
      targetAchieved: config.targetBytes ? finalFileBytes <= config.targetBytes : null,
      timeMs: elapsedMs
    },
    analysis: chosen.analysis,
    controlsApplied: {
      mode: config.mode,
      targetType: config.targetType,
      targetValue: config.targetValue,
      quality: config.quality
    }
  };
}

async function compressImage(inputBuffer, rawConfig = {}) {
  const start = performance.now();
  const originalBytes = inputBuffer.length;
  const config = parseCompressionConfig(rawConfig, originalBytes);

  const huffmanCandidate = await buildHuffmanCandidate(inputBuffer, config);
  const candidates = [huffmanCandidate];

  if (config.mode === "lossy" || huffmanCandidate.compressedFileBuffer.length >= originalBytes) {
    candidates.push(await buildStoredCandidate(inputBuffer, config));
  }

  const chosen = chooseBestCandidate(candidates, config.targetBytes);
  const end = performance.now();

  return buildCompressionResponse({
    originalBytes,
    chosen,
    elapsedMs: end - start,
    config
  });
}

async function estimateCompression(inputBuffer, rawConfig = {}) {
  const originalBytes = inputBuffer.length;
  const config = parseCompressionConfig(rawConfig, originalBytes);

  const huffmanCandidate = await buildHuffmanCandidate(inputBuffer, config);
  const candidates = [huffmanCandidate];

  if (config.mode === "lossy" || huffmanCandidate.compressedFileBuffer.length >= originalBytes) {
    candidates.push(await buildStoredCandidate(inputBuffer, config));
  }

  const chosen = chooseBestCandidate(candidates, config.targetBytes);

  const estimatedBytes = chosen.compressedFileBuffer.length;
  const estimatedReductionPercent = originalBytes > 0 ? (1 - (estimatedBytes / originalBytes)) * 100 : 0;

  return {
    estimatedBytes,
    estimatedReductionPercent,
    strategy: chosen.strategy,
    controlsApplied: {
      mode: config.mode,
      targetType: config.targetType,
      targetValue: config.targetValue,
      quality: config.quality,
      targetBytes: config.targetBytes
    }
  };
}

async function decompressImage(compressedBuffer) {
  const start = performance.now();

  const { header, encodedData } = unpackCompressedFile(compressedBuffer);

  if (header.method === METHOD_STORED_IMAGE) {
    const outputBuffer = Buffer.from(encodedData);
    const end = performance.now();

    return {
      header,
      outputBuffer,
      mimeType: formatToMime(header.format || "png"),
      stats: {
        decompressedBytes: outputBuffer.length,
        timeMs: end - start
      }
    };
  }

  const { width, height, channels, frequencies, bitLength } = header;

  const { root } = buildHuffmanTree(frequencies);
  const expectedSymbols = width * height * channels;
  const decodedPixels = decodeData(encodedData, bitLength, root, expectedSymbols);

  const outputBuffer = await sharp(decodedPixels, {
    raw: {
      width,
      height,
      channels
    }
  })
    .png()
    .toBuffer();

  const end = performance.now();

  return {
    header,
    outputBuffer,
    mimeType: "image/png",
    stats: {
      decompressedBytes: outputBuffer.length,
      timeMs: end - start
    }
  };
}

async function optimizeImage(inputBuffer, format = "webp", quality = 70) {
  const start = performance.now();

  const normalizedFormat = format === "jpeg" ? "jpeg" : "webp";
  const safeQuality = clamp(Number(quality) || 70, 20, 95);

  let pipeline = sharp(inputBuffer);

  if (normalizedFormat === "jpeg") {
    pipeline = pipeline.jpeg({ quality: safeQuality, mozjpeg: true });
  } else {
    pipeline = pipeline.webp({ quality: safeQuality });
  }

  const optimizedBuffer = await pipeline.toBuffer();
  const end = performance.now();

  const originalBytes = inputBuffer.length;
  const optimizedBytes = optimizedBuffer.length;

  return {
    optimizedBuffer,
    stats: {
      originalBytes,
      optimizedBytes,
      ratio: optimizedBytes > 0 ? originalBytes / optimizedBytes : 0,
      reductionPercent: originalBytes > 0 ? (1 - (optimizedBytes / originalBytes)) * 100 : 0,
      timeMs: end - start,
      format: normalizedFormat,
      quality: safeQuality
    }
  };
}

export {
  compressImage,
  decompressImage,
  estimateCompression,
  optimizeImage,
  unpackCompressedFile
};
