import { Settings2, SlidersHorizontal } from "lucide-react";

function ControlPanel({
  controls,
  onControlChange,
  onCompress,
  onDecompress,
  onOptimize,
  onDownloadCompressed,
  busy,
  canDecompress,
  canDownloadCompressed
}) {
  return (
    <section className="panel animate-riseIn">
      <h2 className="panel-title">2. Controls Panel</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="mode">
            Compression Mode
          </label>
          <select
            id="mode"
            className="select"
            value={controls.mode}
            onChange={(event) => onControlChange("mode", event.target.value)}
            title="Lossless keeps exact pixel values. Lossy gives much smaller files."
          >
            <option value="lossless">Lossless (Pure Huffman)</option>
            <option value="lossy">Lossy + Huffman</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="colorMode">
            Channel Mode
          </label>
          <select
            id="colorMode"
            className="select"
            value={controls.colorMode}
            onChange={(event) => onControlChange("colorMode", event.target.value)}
            title="Grayscale can reduce data size significantly."
          >
            <option value="rgb">RGB</option>
            <option value="grayscale">Grayscale</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="targetType">
            Target Compression By
          </label>
          <select
            id="targetType"
            className="select"
            value={controls.targetType}
            onChange={(event) => onControlChange("targetType", event.target.value)}
            title="Pick your target strategy: percentage, target size, or quality."
          >
            <option value="percentage">Percentage Smaller</option>
            <option value="size">Target Size (KB)</option>
            <option value="quality">Quality (0-100)</option>
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="targetValue">
            Target Value
          </label>
          <input
            id="targetValue"
            className="input"
            type="number"
            value={controls.targetValue}
            min="1"
            max={controls.targetType === "quality" ? "100" : undefined}
            onChange={(event) => onControlChange("targetValue", event.target.value)}
            title="If Percentage: enter percent. If Size: enter KB. If Quality: 0-100."
          />
          <p className="field-help">
            {controls.targetType === "percentage" && "Example: 40 means 40% smaller target."}
            {controls.targetType === "size" && "Example: 120 means target around 120 KB."}
            {controls.targetType === "quality" && "Higher quality preserves detail but increases file size."}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="field-label mb-0" htmlFor="quality">
            Quality Slider
          </label>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="h-3 w-3" />
            {controls.quality}
          </span>
        </div>
        <input
          id="quality"
          type="range"
          min="0"
          max="100"
          value={controls.quality}
          onChange={(event) => onControlChange("quality", event.target.value)}
          className="w-full accent-cyan-700"
          title="Adjusts quantization and optional lossy preprocessing intensity."
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={onCompress} disabled={busy}>
          <Settings2 className="h-4 w-4" />
          Compress
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onDecompress}
          disabled={busy || !canDecompress}
        >
          Decompress
        </button>
        <button type="button" className="btn btn-secondary" onClick={onOptimize} disabled={busy}>
          Make Smaller Image
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onDownloadCompressed}
          disabled={busy || !canDownloadCompressed}
        >
          Download Compressed File
        </button>
      </div>
    </section>
  );
}

export default ControlPanel;
