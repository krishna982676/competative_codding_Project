import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import FrequencyTable from "./FrequencyTable";
import TreeView from "./TreeView";
import FrequencyBarChart from "./FrequencyBarChart";
import BitLengthChart from "./BitLengthChart";

function AnalysisPanel({ analysis }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="panel animate-riseIn">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <h2 className="panel-title mb-0">5. Advanced Analysis</h2>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-800">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? "Collapse" : "Expand"}
        </span>
      </button>

      {!expanded ? (
        <p className="mt-3 text-sm text-slate-500">Expand to view frequency data, charts, tree, and merge steps.</p>
      ) : (
        <div className="mt-4 space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <FrequencyBarChart rows={analysis?.frequencyTable || []} />
            <BitLengthChart data={analysis?.codeLengthDistribution || []} />
          </div>

          <div>
            <h3 className="mb-2 font-display text-lg font-bold text-slate-900">Searchable Frequency Table</h3>
            <FrequencyTable rows={analysis?.frequencyTable || []} />
          </div>

          <div>
            <h3 className="mb-2 font-display text-lg font-bold text-slate-900">Interactive Huffman Tree</h3>
            <TreeView tree={analysis?.tree || null} />
          </div>

          <div>
            <h3 className="mb-2 font-display text-lg font-bold text-slate-900">Tree Construction Steps</h3>
            {!analysis?.mergeSteps?.length ? (
              <p className="text-sm text-slate-500">Merge steps appear after compression.</p>
            ) : (
              <ol className="max-h-56 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                {analysis.mergeSteps.slice(0, 80).map((step, index) => (
                  <li key={`merge-${index}`}>
                    ({step.leftValue ?? "N"}:{step.leftFrequency}) + ({step.rightValue ?? "N"}:{step.rightFrequency})
                    =&gt; {step.mergedFrequency}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default AnalysisPanel;
