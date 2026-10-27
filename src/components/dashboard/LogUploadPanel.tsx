import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileCode,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Database,
  Sparkles,
  FileSpreadsheet,
  Binary
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QueuedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
}

interface LogUploadPanelProps {
  onProcessFiles: (files: File[]) => Promise<void>;
  onUseSampleLogs: () => void;
  isDemoMode: boolean;
  isProcessing: boolean;
  scanCompletedInfo: {
    fileNames: string[];
    totalLines: number;
    timestamp: string;
    isSimulated: boolean;
  } | null;
  onClearUploadedData: () => void;
}

const ALLOWED_EXTENSIONS = ['.log', '.txt', '.json', '.csv', '.jsonl'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const LogUploadPanel: React.FC<LogUploadPanelProps> = ({
  onProcessFiles,
  onUseSampleLogs,
  isDemoMode,
  isProcessing,
  scanCompletedInfo,
  onClearUploadedData,
}) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Validate files
  const validateAndAddFiles = useCallback((incomingFiles: FileList | File[]) => {
    setValidationError(null);
    const newValidFiles: QueuedFile[] = [];
    const errors: string[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();

      // Check extension
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        errors.push(`"${file.name}": Unsupported format. Allowed: .log, .txt, .json, .csv, .jsonl`);
        return;
      }

      // Check size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}": File size (${formatSize(file.size)}) exceeds 25 MB limit.`);
        return;
      }

      // Check empty
      if (file.size === 0) {
        errors.push(`"${file.name}": File is empty (0 bytes).`);
        return;
      }

      // Prevent duplicate file by name and size
      const isAlreadyQueued = queuedFiles.some((f) => f.name === file.name && f.size === file.size);
      if (!isAlreadyQueued) {
        newValidFiles.push({
          file,
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          extension: extension.replace('.', '').toUpperCase(),
        });
      }
    });

    if (errors.length > 0) {
      setValidationError(errors.join(' '));
    }

    if (newValidFiles.length > 0) {
      setQueuedFiles((prev) => [...prev, ...newValidFiles]);
    }
  }, [queuedFiles]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the panel boundary
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  // Remove single file
  const handleRemoveFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((f) => f.id !== id));
    setValidationError(null);
  };

  // Clear all queued files
  const handleClearAll = () => {
    setQueuedFiles([]);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Trigger scan execution
  const handleRunScan = async () => {
    if (queuedFiles.length === 0 && !isDemoMode) {
      setValidationError('Please select at least one log file or load sample logs to run analysis.');
      return;
    }

    if (queuedFiles.length > 0) {
      const filesToProcess = queuedFiles.map((q) => q.file);
      await onProcessFiles(filesToProcess);
      setQueuedFiles([]); // Clear queue once processed into active state
    }
  };

  // Calculate total queued size
  const totalQueuedSize = queuedFiles.reduce((acc, f) => acc + f.size, 0);

  // Can the user run a scan? Enabled if files are queued OR if demo mode is loaded
  const canScan = (queuedFiles.length > 0 || isDemoMode) && !isProcessing;

  const getFileBadgeColor = (ext: string) => {
    switch (ext) {
      case 'LOG':
        return 'text-cyan-300 bg-cyan-950/60 border-cyan-800/60';
      case 'JSON':
      case 'JSONL':
        return 'text-teal-300 bg-teal-950/60 border-teal-800/60';
      case 'CSV':
        return 'text-amber-300 bg-amber-950/60 border-amber-800/60';
      case 'TXT':
      default:
        return 'text-slate-300 bg-slate-800/60 border-slate-700/60';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-[#0B1120] to-[#080D18] p-5 shadow-2xl shadow-black/40 relative overflow-hidden backdrop-blur-md">
      {/* Subtle top cyan line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".log,.txt,.json,.csv,.jsonl"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            validateAndAddFiles(e.target.files);
          }
        }}
        className="hidden"
      />

      {/* Header and status line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/50">
            <UploadCloud className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Upload Log Files
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                .log, .txt, .json, .csv, .jsonl
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag and drop files here or browse your computer
            </p>
          </div>
        </div>

        {/* Action Controls & Sample Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onUseSampleLogs}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 transition-colors shadow-sm disabled:opacity-50"
            title="Load sample Linux auth.log, syslog, and nginx benchmark dataset"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Use Sample Logs</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-950/90 to-slate-900 hover:border-cyan-400 text-cyan-200 transition-all shadow-sm shadow-cyan-950/40 disabled:opacity-50"
          >
            <span>Choose Files</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Target Zone */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20 scale-[1.005]'
            : 'border-slate-700/80 hover:border-cyan-500/50 bg-slate-950/50 hover:bg-slate-900/40'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className={`p-3 rounded-2xl transition-transform ${isDragging ? 'scale-110 bg-cyan-900/50 text-cyan-300' : 'bg-slate-900 text-slate-400'}`}>
            <UploadCloud className="w-7 h-7 text-cyan-400" />
          </div>

          <div className="text-xs">
            <span className="font-semibold text-slate-200">
              {isDragging ? 'Drop files to stage for analysis' : 'Drop log files here, or click to browse'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Linux syslog, systemd, web proxy, auditd, and application JSON records up to 25 MB
            </p>
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-start justify-between gap-2"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{validationError}</span>
          </div>
          <button
            onClick={() => setValidationError(null)}
            className="text-rose-400 hover:text-rose-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Selected Files Staging Shelf */}
      {queuedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-slate-800/80 space-y-3"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">Staged Files</span>
              <span className="font-mono text-[11px] text-cyan-300 px-2 py-0.2 rounded-full bg-cyan-950/70 border border-cyan-800/60">
                {queuedFiles.length} {queuedFiles.length === 1 ? 'file' : 'files'} ({formatSize(totalQueuedSize)})
              </span>
            </div>

            <button
              onClick={handleClearAll}
              disabled={isProcessing}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear Queue
            </button>
          </div>

          {/* Queued files grid / chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {queuedFiles.map((qFile) => (
              <div
                key={qFile.id}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/70 flex items-center justify-between gap-2 text-xs shadow-sm hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getFileBadgeColor(qFile.extension)}`}>
                    {qFile.extension}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-200 truncate font-mono text-[11px]" title={qFile.name}>
                      {qFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {formatSize(qFile.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(qFile.id);
                  }}
                  disabled={isProcessing}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                  title="Remove this file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed Scan Status Card */}
      {scanCompletedInfo && queuedFiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-emerald-200">
                  Telemetry Ingest Completed
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                  {scanCompletedInfo.isSimulated ? 'Simulated Benchmark' : 'User Upload'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Parsed <strong className="text-white font-mono">{scanCompletedInfo.totalLines.toLocaleString()}</strong> records from{' '}
                <span className="text-emerald-300 font-mono">{scanCompletedInfo.fileNames.join(', ')}</span> at {scanCompletedInfo.timestamp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Upload Another File
            </button>
            <button
              onClick={onClearUploadedData}
              className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
            >
              Clear Data
            </button>
          </div>
        </motion.div>
      )}

      {/* Run Model Scan Execution Strip */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <div className={`w-2 h-2 rounded-full ${canScan ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_#00F2FE]' : 'bg-slate-700'}`} />
          <span>
            {isProcessing ? (
              <span className="text-cyan-300 font-mono">Processing telemetry stream...</span>
            ) : queuedFiles.length > 0 ? (
              <span className="text-slate-300">
                Ready to analyze <strong className="text-cyan-300 font-mono">{queuedFiles.length}</strong> file(s)
              </span>
            ) : isDemoMode ? (
              <span className="text-slate-400">
                Sample benchmark dataset loaded (<strong className="text-cyan-400">srv-edge-linux01</strong>)
              </span>
            ) : (
              <span className="text-slate-400">
                Select or drop log files to enable model scan
              </span>
            )}
          </span>
        </div>

        {/* Run Model Scan Button */}
        <button
          type="button"
          onClick={handleRunScan}
          disabled={!canScan}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
            canScan
              ? 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-cyan-500/25 cursor-pointer active:scale-95'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-60'
          }`}
          title={canScan ? 'Parse and run heuristic analysis on staged files' : 'Select or drop files first'}
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing Stream...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Model Scan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
