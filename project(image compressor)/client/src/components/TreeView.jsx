import { useMemo, useState } from "react";

function nodeId(path) {
  return path.join("-");
}

function TreeNode({ node, path, collapsed, setCollapsed, zoom }) {
  if (!node) {
    return null;
  }

  const id = nodeId(path);
  const isLeaf = !node.left && !node.right;
  const isCollapsed = collapsed.has(id);

  return (
    <li className="mb-2">
      <button
        type="button"
        className={`tree-node ${
          isLeaf
            ? "border-emerald-300 bg-emerald-50 text-emerald-900"
            : "border-amber-300 bg-amber-50 text-amber-900"
        }`}
        style={{ transform: `scale(${zoom})`, transformOrigin: "left top" }}
        onClick={() => {
          if (isLeaf) {
            return;
          }

          setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
              next.delete(id);
            } else {
              next.add(id);
            }
            return next;
          });
        }}
      >
        {isLeaf ? `Leaf ${node.value}` : "Internal"} | f={node.frequency}
      </button>

      {!isLeaf && !isCollapsed ? (
        <ul className="ml-4 mt-2 border-l border-slate-200 pl-3">
          {node.left ? (
            <TreeNode
              node={node.left}
              path={[...path, 0]}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              zoom={zoom}
            />
          ) : null}
          {node.right ? (
            <TreeNode
              node={node.right}
              path={[...path, 1]}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              zoom={zoom}
            />
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

function TreeView({ tree }) {
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState(new Set());

  const nodeCount = useMemo(() => {
    function count(node) {
      if (!node) {
        return 0;
      }
      return 1 + count(node.left) + count(node.right);
    }
    return count(tree);
  }, [tree]);

  if (!tree) {
    return <p className="text-sm text-slate-500">Tree will appear after compression.</p>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">Nodes: {nodeCount}</p>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600" htmlFor="zoomRange">
            Zoom
          </label>
          <input
            id="zoomRange"
            type="range"
            min="0.6"
            max="1.6"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="accent-cyan-700"
          />
        </div>
      </div>

      <div className="max-h-96 overflow-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
        <ul>
          <TreeNode node={tree} path={[0]} collapsed={collapsed} setCollapsed={setCollapsed} zoom={zoom} />
        </ul>
      </div>
    </div>
  );
}

export default TreeView;
