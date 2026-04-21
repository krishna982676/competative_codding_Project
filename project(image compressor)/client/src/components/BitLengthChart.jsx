function BitLengthChart({ data }) {
  if (!data?.length) {
    return <p className="text-sm text-slate-500">Bit-length distribution chart will appear after compression.</p>;
  }

  const maxCount = Math.max(...data.map((item) => item.count));

  return (
    <div className="chart-wrap">
      <p className="mb-2 text-sm font-semibold text-slate-700">Bit-Length Distribution</p>
      <div className="space-y-1">
        {data.map((item) => (
          <div key={`bits-${item.bitLength}`} className="grid grid-cols-[80px_1fr_70px] items-center gap-2 text-xs">
            <span className="font-mono text-slate-600">{item.bitLength} bits</span>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-emerald-600"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-right font-semibold text-slate-700">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BitLengthChart;
