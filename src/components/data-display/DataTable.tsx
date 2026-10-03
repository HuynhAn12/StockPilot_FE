import type { ReactNode } from "react";

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <div className="max-w-full overflow-hidden rounded-lg border border-(--sp-border) bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-170 border-collapse text-left text-sm">
          <thead className="bg-(--sp-bg-subtle) text-[13px] text-(--sp-text-muted)">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-(--sp-border) px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-(--sp-surface-hover)">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="h-12 border-b border-(--sp-border) px-4 py-2 last:border-b-0">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
