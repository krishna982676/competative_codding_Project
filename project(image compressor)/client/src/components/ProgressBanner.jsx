function ProgressBanner({ busy, stage, progress }) {
  if (!busy) {
    return null;
  }

  return (
    <div className="panel animate-riseIn">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-slate-900">Processing</h3>
        <span className="text-sm font-semibold text-cyan-800">{Math.round(progress)}%</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{stage}</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-cyan-700 transition-all duration-200"
          style={{ width: `${Math.max(6, progress)}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBanner;
