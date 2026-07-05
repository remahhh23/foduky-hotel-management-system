export function downloadCSV(headers: string[], rows: string[][], filename: string, separator = ";"): void {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(separator), ...rows.map((r) => r.map(escape).join(separator))];
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatCSVNumber(n: number): string {
  return n.toFixed(2).replace(".", ",");
}