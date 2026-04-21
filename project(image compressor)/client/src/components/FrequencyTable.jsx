import { useMemo, useState } from "react";

const PAGE_SIZE = 12;

function FrequencyTable({ rows }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }

    return rows.filter((row) => {
      const valueMatch = String(row.value).includes(q);
      const codeMatch = row.code.toLowerCase().includes(q);
      return valueMatch || codeMatch;
    });
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!rows?.length) {
    return <p className="text-sm text-slate-500">No frequency data yet.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search value or code"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <span className="text-xs font-semibold text-slate-500">
          Showing {pageRows.length} of {filteredRows.length} rows
        </span>
      </div>

      <div className="table-scroll">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Pixel</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Frequency</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Code</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">Bit Length</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pageRows.map((row) => (
              <tr key={`${row.value}-${row.code}`}>
                <td className="px-3 py-2 font-mono text-slate-700">{row.value}</td>
                <td className="px-3 py-2 text-slate-700">{row.frequency}</td>
                <td className="px-3 py-2 font-mono text-cyan-800">{row.code}</td>
                <td className="px-3 py-2 text-slate-700">{row.bitLength}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary px-3 py-1.5 text-xs"
          disabled={safePage <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </button>
        <span className="text-xs font-semibold text-slate-600">
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary px-3 py-1.5 text-xs"
          disabled={safePage >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default FrequencyTable;
