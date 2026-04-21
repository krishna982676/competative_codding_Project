# Huffman Image Compressor Pro

A professional redesign of the DAA Huffman Image Compressor project with:
- accurate compression math
- adaptive target compression controls
- modern SaaS-style React + Tailwind UI
- interactive Huffman analysis

## What Was Fixed

### 1) Compression Correctness
- Replaced string-based bit encoding with true bit-level packing in server Huffman core.
- Added compact binary container format (`HUFIMG3`) to reduce metadata overhead.
- Preserved backward compatibility for legacy `HUFIMG1` and `HUFIMG2` files.
- Added strategy selection:
  - `lossless-huffman`
  - `lossy-huffman`
  - `lossy-webp-stored` fallback when target or size constraints require it

### 2) Accurate Stats
Stats now separate and show:
- Original size
- Encoded bit size
- Packed encoded bytes
- Metadata/header overhead
- Final file size
- Compression ratio (original/final)
- Space reduction percentage

### 3) Target Compression Controls
User can compress by:
- Percentage smaller
- Target size in KB
- Quality 0-100

Backend dynamically adjusts:
- quantization levels
- channel reduction (grayscale when suitable)
- optional lossy preprocessing (blur/resize profile when aggressive)

### 4) UX and Feedback
- Better validation and error messaging on API failures
- Real-time size estimation (`/api/estimate`) before compression
- Progress bar while compression/decompression is running
- Clear status updates and safer action states

## Modern UI/UX Redesign

Frontend stack:
- React + Vite
- Tailwind CSS
- Lucide icons

New dashboard sections:
1. Upload Panel
2. Controls Panel
3. Preview Panel (original, reconstructed, optimized, difference heatmap)
4. Stats Dashboard
5. Advanced Analysis (expand/collapse)

Advanced analysis includes:
- Searchable + paginated frequency table
- Interactive Huffman tree (zoom + collapse nodes)
- Top frequency bar chart
- Bit-length distribution chart
- Merge steps list

## Folder Structure

```text
DAA PROJECT/
|-- client/
|   |-- src/
|   |   |-- components/
|   |   |   |-- AnalysisPanel.jsx
|   |   |   |-- BitLengthChart.jsx
|   |   |   |-- ControlPanel.jsx
|   |   |   |-- FrequencyBarChart.jsx
|   |   |   |-- FrequencyTable.jsx
|   |   |   |-- PreviewPanel.jsx
|   |   |   |-- ProgressBanner.jsx
|   |   |   |-- StatsDashboard.jsx
|   |   |   |-- TreeView.jsx
|   |   |   `-- UploadPanel.jsx
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   `-- styles.css
|   |-- index.html
|   |-- package.json
|   |-- postcss.config.js
|   |-- tailwind.config.js
|   `-- vite.config.js
|-- server/
|   |-- src/
|   |   |-- utils/
|   |   |   |-- huffman.js
|   |   |   `-- imageCodec.js
|   |   `-- index.js
|   `-- package.json
|-- package.json
`-- README.md
```

## API Endpoints

### `POST /api/estimate`
Form-data:
- `image`
- `mode` = `lossless` | `lossy`
- `colorMode` = `rgb` | `grayscale`
- `targetType` = `percentage` | `size` | `quality`
- `targetValue`
- `quality`

Returns estimated output bytes and strategy.

### `POST /api/compress`
Form-data: same as `/api/estimate`.

Returns:
- `header`
- `stats` (accurate breakdown)
- `analysis` (frequency table, tree, merge steps, code-length distribution)
- `controlsApplied`
- `compressedBase64`

### `POST /api/decompress`
JSON:
```json
{
  "compressedBase64": "..."
}
```

Returns:
- reconstructed image base64
- mime type
- decompression stats

### `POST /api/optimize`
Form-data:
- `image`
- `format` (`webp` or `jpeg`)
- `quality`

Returns optimized image and size reduction stats.

## How To Run

From project root:

```bash
npm install
npm run dev
```

Default URLs:
- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

## Notes for College Submission

This project demonstrates:
- Greedy algorithm design (Huffman)
- Priority queue/min-heap optimization
- Bit-level encoding/decoding
- Binary container format design
- Practical compression tradeoffs (lossless vs lossy)
- Modern full-stack product-level UI/UX

## Screenshot Placeholders

Capture these and add to your report:
- Upload + controls with target compression mode
- Real-time estimate panel
- Stats dashboard with overhead breakdown
- Side-by-side preview with difference heatmap
- Advanced analysis expanded (charts + table + tree)