'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadCloud, FileText, Trash2, RefreshCw, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = '/api/proxy';
const DOCS_PER_PAGE = 5;

interface Document {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  status: 'Processing' | 'Completed' | 'Failed';
  chunkCount: number;
  createdAt: string;
}

interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

const StatusBadge = ({ status }: { status: Document['status'] }) => {
  const config = {
    Completed: { icon: CheckCircle, label: 'Indexed', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    Processing: { icon: Clock, label: 'Processing', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    Failed: { icon: XCircle, label: 'Failed', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
  };
  const { icon: Icon, label, className } = config[status] || config.Failed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  return d.toLocaleDateString();
};

export default function DocumentsDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragging: false,
    isUploading: false,
    progress: 0,
    error: null,
    success: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/documents`);
      const data = await res.json();
      if (data.success) setDocuments(data.data);
    } catch {
      console.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const uploadFile = async (file: File) => {
    if (!file) return;

    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.type)) {
      setUploadState(s => ({ ...s, error: 'Only PDF and TXT files are supported.', success: null }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(s => ({ ...s, error: 'File exceeds the 10MB limit.', success: null }));
      return;
    }

    setUploadState(s => ({ ...s, isUploading: true, error: null, success: null, progress: 10 }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(s => ({ ...s, progress: Math.min(s.progress + 8, 85) }));
      }, 600);

      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadState(s => ({ ...s, progress: 100 }));

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadState(s => ({
        ...s,
        isUploading: false,
        success: `"${file.name}" uploaded successfully — ${data.data.chunksCreated} chunks indexed.`,
        error: null,
        progress: 0,
      }));

      // Refresh document list
      fetchDocuments();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadState(s => ({
        ...s,
        isUploading: false,
        error: message,
        success: null,
        progress: 0,
      }));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(s => ({ ...s, isDragging: false }));
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its indexed chunks?`)) return;
    try {
      await fetch(`${API_URL}/api/documents/${id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch {
      alert('Failed to delete document.');
    }
  };

  // Pagination
  const totalPages = Math.ceil(documents.length / DOCS_PER_PAGE);
  const pagedDocs = documents.slice((page - 1) * DOCS_PER_PAGE, page * DOCS_PER_PAGE);

  return (
    <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full relative z-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Processing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload PDFs or text files to chunk and index them into the RAG knowledge base.
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="flex items-center gap-2 text-xs border px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Upload Zone */}
      <div
        className={`mb-8 w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center
          bg-background/50 backdrop-blur-sm cursor-pointer transition-all
          ${uploadState.isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-foreground/30 hover:bg-muted/20'}
          ${uploadState.isUploading ? 'pointer-events-none opacity-80' : ''}
        `}
        onClick={() => !uploadState.isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setUploadState(s => ({ ...s, isDragging: true })); }}
        onDragLeave={() => setUploadState(s => ({ ...s, isDragging: false }))}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {uploadState.isUploading ? (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
            <p className="font-semibold text-sm mb-2">Indexing document…</p>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{uploadState.progress}%</p>
          </>
        ) : (
          <>
            <UploadCloud className={`w-10 h-10 mb-4 transition-colors ${uploadState.isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="font-semibold text-sm mb-1">
              {uploadState.isDragging ? 'Drop to upload' : 'Click or drag & drop to upload'}
            </p>
            <p className="text-xs text-muted-foreground">PDF, TXT accepted — Max 10MB</p>
          </>
        )}
      </div>

      {/* Status Messages */}
      {uploadState.success && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{uploadState.success}</p>
        </div>
      )}
      {uploadState.error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{uploadState.error}</p>
        </div>
      )}

      {/* Document List */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span>Active Knowledge Base <span className="text-muted-foreground font-normal text-sm ml-2">({documents.length} file{documents.length !== 1 ? 's' : ''})</span></span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs font-normal">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border px-2 py-1 rounded bg-background hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border px-2 py-1 rounded bg-background hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border rounded-xl bg-background animate-pulse h-16" />
            ))}
          </div>
        ) : pagedDocs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-2xl">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">No documents yet</p>
            <p className="text-xs mt-1">Upload a PDF or TXT file to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pagedDocs.map(doc => (
              <div
                key={doc._id}
                className="p-4 border rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-between shadow-sm hover:border-foreground/20 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                    ${doc.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                      doc.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-red-500/10 text-red-500'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate max-w-xs">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(doc.createdAt)}
                      {doc.chunkCount > 0 && ` • ${doc.chunkCount} chunks`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} />
                  <button
                    onClick={() => handleDelete(doc._id, doc.fileName)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
