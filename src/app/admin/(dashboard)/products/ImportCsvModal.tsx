"use client";

import { useState } from "react";
import { CheckCircle2, Download, Upload, X, XCircle } from "lucide-react";
import { parseProductsCsv, buildCsvTemplate, type ImportRowResult } from "@/lib/csv";
import type { Category, Product } from "@/lib/products";

export function ImportCsvModal({
  categories,
  onCancel,
  onImport,
}: {
  categories: Category[];
  onCancel: () => void;
  onImport: (products: Omit<Product, "slug">[]) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ImportRowResult[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<{ success: number; failed: number } | null>(null);

  const validRows = parsed?.filter((r): r is ImportRowResult & { ok: true } => r.ok) ?? [];
  const invalidRows = parsed?.filter((r): r is ImportRowResult & { ok: false } => !r.ok) ?? [];

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  };

  const handlePreview = () => {
    setParsed(parseProductsCsv(text, categories));
    setSummary(null);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(validRows.map((r) => r.product));
      setSummary({ success: validRows.length, failed: invalidRows.length });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildCsvTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-6 py-10">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-cream-50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Import Products from CSV</h2>
          <button onClick={onCancel} className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {summary ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-forest-800/10 p-4 text-forest-800">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <p className="text-sm font-medium">
                Imported {summary.success} product{summary.success === 1 ? "" : "s"}.
                {summary.failed > 0 && ` ${summary.failed} row(s) were skipped — see errors below.`}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-700/70">
              Columns: name, category, badge, price, compareAtPrice, unit, stock, rating,
              reviewCount, description, colors, sizes, specs. Use <code>;</code> to separate
              multiple colors/sizes/specs within a cell. Category must match an existing category
              name or slug.
            </p>

            <button
              onClick={downloadTemplate}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:underline"
            >
              <Download className="h-4 w-4" />
              Download CSV template
            </button>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Upload a .csv file
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="mt-2 block text-xs text-ink-700/70 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Or paste CSV text
              </label>
              <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="name,category,badge,price,..."
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-xs font-mono focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>

            <button
              onClick={handlePreview}
              disabled={!text.trim()}
              className="mt-4 flex items-center gap-2 rounded-full border border-ink-900/15 px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-900/5 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              Preview
            </button>

            {parsed && (
              <div className="mt-5">
                <p className="text-sm font-semibold text-ink-900">
                  {validRows.length} valid, {invalidRows.length} with errors
                </p>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-ink-900/8">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-ink-900/5">
                      {parsed.map((result) => (
                        <tr key={result.row}>
                          <td className="px-3 py-2 text-ink-700/50">Row {result.row}</td>
                          <td className="px-3 py-2">
                            {result.ok ? (
                              <span className="flex items-center gap-1.5 text-forest-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {result.product.name}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-red-600">
                                <XCircle className="h-3.5 w-3.5" />
                                {result.reason}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing}
                  className="mt-4 w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {importing ? "Importing…" : `Import ${validRows.length} Product${validRows.length === 1 ? "" : "s"}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
