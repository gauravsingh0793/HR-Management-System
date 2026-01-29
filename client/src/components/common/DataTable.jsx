import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Search, RefreshCw, Plus, Loader2 } from "lucide-react";

function inferColumns(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const first = rows.find((d) => d && typeof d === "object") || {};
  const keys = Object.keys(first).filter(
    (k) => !k.startsWith("_") && k !== "__v",
  );
  const primitiveKeys = keys.filter((k) => {
    const v = first[k];
    return ["string", "number", "boolean"].includes(typeof v);
  });
  const selected = (primitiveKeys.length ? primitiveKeys : keys).slice(0, 5);
  return selected.map((k) => ({ key: k, label: toLabel(k) }));
}

function toLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function DataTable({
  title,
  description,
  data = [],
  loading = false,
  error = "",
  columns,
  onRefresh,
  onCreate,
  createLabel,
  renderActions,
  cardClassName,
}) {
  const [q, setQ] = useState("");
  // Normalize incoming data to an array regardless of API shape
  const baseRows = useMemo(() => {
    const d = data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.items)) return d.items;
    if (d && typeof d === "object") {
      const values = Object.values(d);
      if (
        Array.isArray(values) &&
        values.length &&
        values.every((v) => typeof v === "object")
      ) {
        return values;
      }
    }
    return [];
  }, [data]);

  const cols = useMemo(
    () => columns || inferColumns(baseRows),
    [columns, baseRows],
  );

  const filtered = useMemo(() => {
    if (!q) return baseRows;
    const term = q.toLowerCase();
    return baseRows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term),
    );
  }, [baseRows, q]);

  return (
    <Card className={cardClassName ?? "m-4"}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {!!title && (
              <CardTitle className="text-2xl font-bold text-slate-900">
                {title}
              </CardTitle>
            )}
            {!!description && (
              <CardDescription className="text-base mt-1.5">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="w-48 sm:w-56 pl-9 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="hover-lift"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
            )}
            {onCreate && (
              <Button onClick={onCreate} className="hover-lift">
                <Plus className="w-4 h-4 mr-2" />
                {createLabel || "New"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900">
              Error loading data
            </p>
            <p className="text-sm text-red-700 mt-1">{String(error)}</p>
          </div>
        )}
        {loading ? (
          <div className="space-y-3 py-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : !Array.isArray(filtered) || filtered.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <p className="text-slate-600 font-medium">No data to display</p>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search or add new records
            </p>
          </div>
        ) : (
          <div className="overflow-auto border border-slate-200 rounded-lg shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c.key}
                      className="text-left font-semibold text-slate-700 px-4 py-3 uppercase text-xs tracking-wider"
                    >
                      {c.label}
                    </th>
                  ))}
                  {renderActions && (
                    <th className="text-left font-semibold text-slate-700 px-4 py-3 uppercase text-xs tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row, idx) => (
                  <tr
                    key={row._id || idx}
                    className="hover:bg-blue-50/50 transition-colors duration-150"
                  >
                    {cols.map((c) => (
                      <td key={c.key} className="px-4 py-3 text-slate-700">
                        {renderCell(row[c.key], c.key, row)}
                      </td>
                    ))}
                    {renderActions && (
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function renderCell(v, key, row) {
  if (v == null) return "-";

  // Special handling for status column with color coding
  if (key === "status" && row?.statusColor) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${row.statusColor}`}
      >
        {String(v)}
      </span>
    );
  }

  // Special handling for activeStatus column with color coding
  if (key === "activeStatus" && row?.activeStatusColor) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${row.activeStatusColor}`}
      >
        {String(v)}
      </span>
    );
  }

  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") {
    // Check if it looks like an ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(v.trim())) {
      return "Not specified";
    }
    return v.length > 120 ? v.slice(0, 117) + "..." : v;
  }
  try {
    const s = JSON.stringify(v);
    return s.length > 120 ? s.slice(0, 117) + "..." : s;
  } catch {
    return String(v);
  }
}
