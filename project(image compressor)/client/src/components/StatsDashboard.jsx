function StatCard({ label, value, hint }) {
  return (
    <article className="kpi-card">
      <p className="kpi-label">{label}</p>
      <h3 className="kpi-value">{value}</h3>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}

function StatsDashboard({ stats, estimate }) {
  return (
    <section className="panel animate-riseIn">
      <h2 className="panel-title">4. Stats Dashboard</h2>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-semibold text-amber-900">Real-time Estimate</p>
        <p className="mt-1 text-sm text-amber-800">
          {estimate
            ? `Estimated output: ${estimate.estimatedSizeLabel} (${estimate.estimatedReductionLabel}) via ${estimate.strategy}`
            : "Select image + controls to see estimated output size before compression."}
        </p>
      </div>

      {!stats ? (
        <p className="text-sm text-slate-500">Run compression to populate exact stats.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Original Size" value={stats.originalSizeLabel} />
          <StatCard label="Encoded Bits" value={stats.encodedBitsLabel} hint={stats.encodedBytesLabel} />
          <StatCard label="Metadata" value={stats.metadataLabel} />
          <StatCard label="Final File" value={stats.finalSizeLabel} />
          <StatCard label="Compression Ratio" value={stats.ratioLabel} hint={stats.reductionLabel} />
        </div>
      )}
    </section>
  );
}

export default StatsDashboard;
