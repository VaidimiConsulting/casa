import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchKey?: (item: T) => string;
  filterOptions?: { label: string; value: string }[];
  filterKey?: (item: T) => string;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export default function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  searchKey,
  filterOptions,
  filterKey,
  pageSize = 10,
  loading = false,
  emptyMessage = "No records found.",
  actions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & search logic
  const filteredData = data.filter((item) => {
    let matchesSearch = true;
    if (searchTerm && searchKey) {
      matchesSearch = searchKey(item).toLowerCase().includes(searchTerm.toLowerCase());
    }

    let matchesFilter = true;
    if (filterValue !== "all" && filterKey) {
      matchesFilter = filterKey(item) === filterValue;
    }

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white border border-[#20352b]/15 rounded-3xl overflow-hidden shadow-sm">
      {/* Table Header Actions & Filters */}
      <div className="p-4 sm:p-5 border-b border-[#20352b]/10 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#f5f0e8]/50">
        <div className="flex flex-1 flex-wrap gap-2.5 items-center">
          {searchKey && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#50574d]"
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white border border-[#20352b]/20 rounded-full pl-9 pr-4 py-2 text-xs text-[#1a2f23] focus:outline-none focus:border-[#20352b] transition-colors shadow-2xs"
              />
            </div>
          )}

          {filterOptions && filterKey && (
            <select
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-[#20352b]/20 rounded-full px-3.5 py-2 text-xs font-medium text-[#1a2f23] focus:outline-none focus:border-[#20352b] cursor-pointer shadow-2xs"
            >
              <option value="all">All Statuses</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#20352b]/12 bg-[#f5f0e8] text-[#42483f] text-[11px] uppercase font-mono font-bold tracking-wider">
              {columns.map((col) => (
                <th key={col.key} className={`py-3.5 px-5 font-bold ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#20352b]/8 text-xs text-[#1a2f23]">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#50574d]">
                  <div className="inline-block w-6 h-6 border-2 border-[#20352b]/30 border-t-[#20352b] rounded-full animate-spin mb-2" />
                  <p className="font-medium">Loading records...</p>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-[#50574d]">
                  <Inbox className="w-9 h-9 mx-auto mb-2 opacity-50 text-[#20352b]" />
                  <p className="font-semibold text-sm text-[#1a2f23]">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="hover:bg-[#f5f0e8]/50 transition-colors group"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`py-4 px-5 ${col.className || ""}`}>
                      {col.render
                        ? col.render(item)
                        : (item as any)[col.key] !== undefined
                        ? String((item as any)[col.key])
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredData.length > 0 && (
        <div className="p-4 border-t border-[#20352b]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#50574d] bg-[#f5f0e8]/30">
          <div>
            Showing <span className="font-bold text-[#1a2f23]">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-[#1a2f23]">
              {Math.min(startIndex + pageSize, filteredData.length)}
            </span>{" "}
            of <span className="font-bold text-[#1a2f23]">{filteredData.length}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#20352b]/15 text-[#1a2f23] disabled:opacity-40 hover:bg-[#20352b]/8 transition-colors disabled:hover:bg-transparent cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 font-mono font-bold text-[#1a2f23]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#20352b]/15 text-[#1a2f23] disabled:opacity-40 hover:bg-[#20352b]/8 transition-colors disabled:hover:bg-transparent cursor-pointer"
              title="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
