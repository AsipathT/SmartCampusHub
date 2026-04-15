import React, { useRef, useState, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, ChevronDown } from 'lucide-react';
import { Resource } from '../types/resource';
import { exportCSV, exportPDF } from '../utils/reportExport';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  /** Resources to export (current filtered set) */
  resources: Resource[];
  /** Label used in file names and PDF header e.g. "Resources" or "Maintenance Report" */
  label?: string;
  /** Optional KPI stats to show in PDF header banner */
  stats?: { total: number; active: number; maintenance: number; inactive: number };
  /** Fetch ALL records for full export (if provided, adds "Export All" option) */
  onFetchAll?: () => Promise<Resource[]>;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  resources,
  label = 'Resources',
  stats,
  onFetchAll,
}) => {
  const [open, setOpen]       = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const run = async (key: string, fn: () => void | Promise<void>) => {
    setExporting(key);
    setOpen(false);
    try {
      await fn();
      toast.success('Report downloaded successfully!');
    } catch {
      toast.error('Export failed — please try again.');
    } finally {
      setExporting(null);
    }
  };

  const actions = [
    {
      key: 'csv-page',
      icon: <FileSpreadsheet size={15} className="text-emerald-600" />,
      label: 'Export as CSV',
      sub: `${resources.length} current records`,
      fn: () => exportCSV(resources, label),
    },
    {
      key: 'pdf-page',
      icon: <FileText size={15} className="text-rose-500" />,
      label: 'Export as PDF',
      sub: `${resources.length} current records`,
      fn: () => exportPDF(resources, label, stats),
    },
    ...(onFetchAll
      ? [
          {
            key: 'csv-all',
            icon: <FileSpreadsheet size={15} className="text-emerald-700" />,
            label: 'Export ALL as CSV',
            sub: 'Fetches every record',
            fn: async () => {
              const all = await onFetchAll();
              exportCSV(all, `${label}_Full`);
            },
          },
          {
            key: 'pdf-all',
            icon: <FileText size={15} className="text-rose-700" />,
            label: 'Export ALL as PDF',
            sub: 'Fetches every record',
            fn: async () => {
              const all = await onFetchAll();
              exportPDF(all, `${label}_Full`, stats);
            },
          },
        ]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        id="export-report-btn"
        onClick={() => setOpen(!open)}
        disabled={!!exporting}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all shadow-sm
          ${open
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:text-indigo-700 hover:shadow-md'}`}
      >
        {exporting
          ? <Loader2 size={16} className="animate-spin" />
          : <Download size={16} />}
        {exporting ? 'Exporting…' : 'Export Report'}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden
          animate-[fadeSlideDown_0.18s_ease-out]">

          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-2">
            <Download size={14} className="text-white/80" />
            <p className="text-white text-xs font-bold uppercase tracking-wider">Download Report</p>
          </div>

          {/* Actions */}
          <div className="p-2 space-y-1">
            {actions.map((a, i) => (
              <React.Fragment key={a.key}>
                {/* Divider before "Export ALL" group */}
                {i === 2 && (
                  <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Full Export</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                )}
                <button
                  onClick={() => run(a.key, a.fn)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                    <p className="text-[10px] text-slate-400">{a.sub}</p>
                  </div>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Footer tip */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
            <p className="text-[10px] text-slate-400 text-center">
              📄 CSV opens in Excel · PDF is print-ready
            </p>
          </div>
        </div>
      )}

      {/* Inline keyframe injection */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
