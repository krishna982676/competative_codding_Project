import { useEffect, useRef, useState } from "react";
import { Download, ImageUp, Sparkles } from "lucide-react";

const API_ENDPOINTS = {
  optimize: "/api/optimize"
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "-";
  }

  if (bytes < 1024) {
    return `${bytes.toFixed(0)} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState("");
  const [result, setResult] = useState(null);
  const [quality, setQuality] = useState(78);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Upload a PNG, JPG, or WebP image to make it smaller.");

  const progressTimerRef = useRef(null);

  function handleFile(file) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage("Please upload an image file.");
      return;
    }

    if (originalPreview) {
      URL.revokeObjectURL(originalPreview);
    }

    setSelectedFile(file);
    setResult(null);
    setOriginalPreview(URL.createObjectURL(file));
    setStatusMessage(`Selected ${file.name}`);
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function startProgress(message) {
    setBusy(true);
    setProgress(8);
    setStatusMessage(message);

    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => Math.min(current + Math.random() * 12, 90));
    }, 200);
  }

  function stopProgress() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    setProgress(100);
    window.setTimeout(() => {
      setBusy(false);
      setProgress(0);
    }, 220);
  }

  async function handleOptimizeImage() {
    if (!selectedFile) {
      setStatusMessage("Upload an image before optimizing.");
      return;
    }

    startProgress("Optimizing image for a smaller download...");

    try {
      const payload = new FormData();
      payload.append("image", selectedFile);
      payload.append("format", "webp");
      payload.append("quality", String(quality));

      const response = await fetch(API_ENDPOINTS.optimize, {
        method: "POST",
        body: payload
      });

      const responseBody = await response.json();

      if (!response.ok) {
        throw new Error(responseBody.message || "Optimization failed.");
      }

      setResult(responseBody);
      setStatusMessage(`Done. Reduced to ${formatBytes(responseBody.stats.optimizedBytes)}.`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      stopProgress();
    }
  }

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
      }

      if (originalPreview) {
        URL.revokeObjectURL(originalPreview);
      }
    };
  }, [originalPreview]);

  const downloadHref = result?.optimizedImageBase64
    ? `data:${result.mimeType};base64,${result.optimizedImageBase64}`
    : "";

  const originalSizeLabel = selectedFile ? formatBytes(selectedFile.size) : "-";
  const compressedSizeLabel = result?.stats?.optimizedBytes ? formatBytes(result.stats.optimizedBytes) : "-";
  const reductionLabel = result?.stats?.reductionPercent != null
    ? `${result.stats.reductionPercent.toFixed(2)}% smaller`
    : "-";

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="hero-card animate-riseIn">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="hero-badge inline-flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Simple image size reducer
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Reduce image size with one clean download link
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                Upload an image, choose a quality level, and download the smaller version directly. No extra panels,
                no analysis clutter, just a fast compression flow.
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel space-y-5">
            <div>
              <h2 className="panel-title mb-2">Upload image</h2>
              <p className="text-sm text-slate-600">Drag and drop or browse to load a PNG, JPG, or WebP file.</p>
            </div>

            <label
              className={`upload-drop ${isDragging ? "dragging" : ""}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              htmlFor="imageInput"
            >
              <ImageUp className="mb-3 h-9 w-9 text-cyan-700" />
              <p className="text-sm font-semibold text-slate-800">Drop your image here</p>
              <p className="mt-1 text-xs text-slate-500">or click to choose a file</p>
              <input
                id="imageInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
                disabled={busy}
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Selected file</p>
              <p className="mt-1 truncate text-sm text-slate-600">{selectedFile?.name || "No file selected"}</p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <label className="field-label mb-0" htmlFor="quality">
                  Compression quality
                </label>
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
                  {quality}
                </span>
              </div>
              <input
                id="quality"
                type="range"
                min="40"
                max="95"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="quality-slider w-full"
                disabled={busy}
              />
              <p className="text-xs text-slate-500">
                Lower values create smaller files. Higher values keep more visual detail.
              </p>
            </div>

            <button type="button" className="btn w-full md:w-auto" onClick={handleOptimizeImage} disabled={busy}>
              {busy ? "Processing..." : "Compress image"}
            </button>

            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>

            <div className="status-box">{statusMessage}</div>
          </div>

          <div className="panel space-y-4">
            <h2 className="panel-title mb-2">Result</h2>

            <div className="comparison-grid">
              <div>
                <p className="result-label">Original</p>
                <div className="thumbnail-wrap">
                  {originalPreview ? (
                    <img className="thumbnail" src={originalPreview} alt="Original upload preview" />
                  ) : (
                    <div className="thumbnail-empty">Upload an image to preview it here.</div>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{originalSizeLabel}</p>
              </div>

              <div>
                <p className="result-label">Compressed</p>
                <div className="thumbnail-wrap">
                  {result?.optimizedImageBase64 ? (
                    <img className="thumbnail" src={downloadHref} alt="Compressed image preview" />
                  ) : (
                    <div className="thumbnail-empty">Your compressed image will appear here.</div>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{compressedSizeLabel}</p>
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <span>File reduction</span>
                <strong>{reductionLabel}</strong>
              </div>
              <div className="summary-card">
                <span>Output format</span>
                <strong>WebP</strong>
              </div>
            </div>

            {result?.optimizedImageBase64 ? (
              <a
                className="download-link download-link-wide"
                href={downloadHref}
                download={result.fileName || "compressed.webp"}
              >
                <Download className="h-4 w-4" />
                Download compressed image
              </a>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
