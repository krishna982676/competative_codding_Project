import { ImagePlus } from "lucide-react";

function UploadPanel({
  file,
  statusMessage,
  onSelectFile,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragging,
  busy
}) {
  return (
    <section className="panel animate-riseIn">
      <h2 className="panel-title">1. Upload Panel</h2>

      <label
        className={`upload-drop ${isDragging ? "dragging" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        htmlFor="imageInput"
      >
        <ImagePlus className="mb-2 h-8 w-8 text-cyan-700" />
        <p className="text-sm font-semibold text-slate-800">Drag and drop PNG/JPG image</p>
        <p className="mt-1 text-xs text-slate-500">or click to browse</p>
        <input
          id="imageInput"
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(event) => onSelectFile(event.target.files?.[0])}
          disabled={busy}
        />
      </label>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-sm font-semibold text-slate-700">Selected file</p>
        <p className="mt-1 truncate text-sm text-slate-600">{file?.name || "No file selected"}</p>
      </div>

      <p className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
        {statusMessage}
      </p>
    </section>
  );
}

export default UploadPanel;
