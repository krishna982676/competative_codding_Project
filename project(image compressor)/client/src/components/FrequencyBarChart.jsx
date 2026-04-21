function FrequencyBarChart({ rows }) {
  if (!rows?.length) {
    return <p className="text-sm text-slate-500">Frequency chart will appear after compression.</p>;
  }

  const topRows = rows.slice(0, 20);
  const maxFrequency = Math.max(...topRows.map((row) => row.frequency));

  return (
    <div className="chart-wrap">
      <p className="mb-2 text-sm font-semibold text-slate-700">Top Pixel Frequency (Top 20)</p>
      <div className="space-y-1">
        {topRows.map((row) => (
          <div key={`freq-${row.value}`} className="grid grid-cols-[50px_1fr_60px] items-center gap-2 text-xs">
            <span className="font-mono text-slate-600">{row.value}</span>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-cyan-700"
                style={{ width: `${(row.frequency / maxFrequency) * 100}%` }}
              />
            </div>
            <span className="text-right font-semibold text-slate-700">{row.frequency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FrequencyBarChart;
