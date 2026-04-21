import { useEffect, useMemo, useState } from "react";

function downloadFromUrl(url, fileName) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
}

function computeAbsoluteDiffImage(baseSrc, compareSrc, callback) {
  const base = new Image();
  const compare = new Image();
  base.crossOrigin = "anonymous";
  compare.crossOrigin = "anonymous";

  let loaded = 0;

  const onLoaded = () => {
    loaded += 1;
    if (loaded < 2) {
      return;
    }

    const width = Math.min(base.width, compare.width);
    const height = Math.min(base.height, compare.height);

    if (!width || !height) {
      callback({ heatmapUrl: "", avgDelta: 0 });
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const overlay = document.createElement("canvas");
    const overlayCtx = overlay.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    overlay.width = width;
    overlay.height = height;

    ctx.drawImage(base, 0, 0, width, height);
    const basePixels = ctx.getImageData(0, 0, width, height);

    overlayCtx.drawImage(compare, 0, 0, width, height);
    const comparePixels = overlayCtx.getImageData(0, 0, width, height);

    const output = ctx.createImageData(width, height);
    let totalDiff = 0;

    for (let i = 0; i < basePixels.data.length; i += 4) {
      const dr = Math.abs(basePixels.data[i] - comparePixels.data[i]);
      const dg = Math.abs(basePixels.data[i + 1] - comparePixels.data[i + 1]);
      const db = Math.abs(basePixels.data[i + 2] - comparePixels.data[i + 2]);
      const diff = Math.min(255, dr + dg + db);

      output.data[i] = diff;
      output.data[i + 1] = 30;
      output.data[i + 2] = 255 - diff;
      output.data[i + 3] = 255;

      totalDiff += diff;
    }

    ctx.putImageData(output, 0, 0);

    callback({
      heatmapUrl: canvas.toDataURL("image/png"),
      avgDelta: totalDiff / (width * height)
    });
  };

  base.onload = onLoaded;
  compare.onload = onLoaded;
  base.src = baseSrc;
  compare.src = compareSrc;
}

function PreviewPanel({ originalPreview, reconstructedPreview, optimizedPreview }) {
  const [heatmap, setHeatmap] = useState({ heatmapUrl: "", avgDelta: 0 });

  const comparisonImage = useMemo(() => reconstructedPreview || optimizedPreview, [reconstructedPreview, optimizedPreview]);

  useEffect(() => {
    if (!originalPreview || !comparisonImage) {
      setHeatmap({ heatmapUrl: "", avgDelta: 0 });
      return;
    }

    computeAbsoluteDiffImage(originalPreview, comparisonImage, setHeatmap);
  }, [originalPreview, comparisonImage]);

  return (
    <section className="panel animate-riseIn">
      <h2 className="panel-title">3. Preview Panel</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Original</p>
          {originalPreview ? (
            <img className="preview-frame" src={originalPreview} alt="Original" />
          ) : (
            <div className="preview-frame" />
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Reconstructed</p>
          {reconstructedPreview ? (
            <img className="preview-frame" src={reconstructedPreview} alt="Reconstructed" />
          ) : (
            <div className="preview-frame" />
          )}
          <button
            type="button"
            className="btn btn-secondary mt-2 w-full"
            disabled={!reconstructedPreview}
            onClick={() => downloadFromUrl(reconstructedPreview, "reconstructed.png")}
          >
            Download Reconstructed
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Optimized</p>
          {optimizedPreview ? (
            <img className="preview-frame" src={optimizedPreview} alt="Optimized" />
          ) : (
            <div className="preview-frame" />
          )}
          <button
            type="button"
            className="btn btn-secondary mt-2 w-full"
            disabled={!optimizedPreview}
            onClick={() => downloadFromUrl(optimizedPreview, "optimized-image.png")}
          >
            Download Optimized
          </button>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Difference Heatmap</p>
          {heatmap.heatmapUrl ? (
            <img className="preview-frame" src={heatmap.heatmapUrl} alt="Difference heatmap" />
          ) : (
            <div className="preview-frame" />
          )}
          {heatmap.heatmapUrl ? (
            <p className="mt-1 text-xs text-slate-500">Average visual delta: {heatmap.avgDelta.toFixed(2)}</p>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary mt-2 w-full"
            disabled={!heatmap.heatmapUrl}
            onClick={() => downloadFromUrl(heatmap.heatmapUrl, "difference-heatmap.png")}
          >
            Download Heatmap
          </button>
        </div>
      </div>
    </section>
  );
}

export default PreviewPanel;
