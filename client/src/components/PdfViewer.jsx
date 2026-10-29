import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Terminal, 
  RotateCw, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2 
} from 'lucide-react';

export default function PdfViewer({
  pdfUrl,
  isCompiling,
  compileResult,
  onCompile,
  onErrorLineClick
}) {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'logs'
  const [key, setKey] = useState(Date.now());

  // Automatically switch tab on compile result
  useEffect(() => {
    if (compileResult) {
      if (!compileResult.success) {
        setActiveTab('logs');
      } else {
        setActiveTab('pdf');
      }
    }
  }, [compileResult]);

  const handleRefresh = () => {
    setKey(Date.now());
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 border-l border-gray-800">
      {/* Top Bar Tabs */}
      <div className="h-10 px-3 bg-gray-950 border-b border-gray-800 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition font-medium ${
              activeTab === 'pdf'
                ? 'bg-gray-800 text-indigo-400 border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded transition font-medium relative ${
              activeTab === 'logs'
                ? 'bg-gray-800 text-indigo-400 border border-gray-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs & Errors</span>
            {compileResult?.errors && compileResult.errors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* PDF Actions */}
        {pdfUrl && activeTab === 'pdf' && (
          <div className="flex items-center space-x-1">
            <button
              onClick={handleRefresh}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
              title="Reload PDF preview"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-gray-950">
        {activeTab === 'pdf' ? (
          pdfUrl ? (
            <div className="w-full h-full relative">
              <iframe
                key={key}
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                title="LaTeX PDF Preview"
                className="w-full h-full border-0 bg-gray-800"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 text-indigo-400/60 font-serif text-2xl font-bold">
                PDF
              </div>
              <h3 className="text-base font-semibold text-gray-300 mb-1">
                No PDF Preview Available
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                Click "Compile PDF" in the top bar (or press Ctrl + S) to build the document.
              </p>
              <button
                onClick={onCompile}
                disabled={isCompiling}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition"
              >
                {isCompiling ? 'Compiling...' : 'Compile Now'}
              </button>
            </div>
          )
        ) : (
          /* Logs & Diagnostics Tab */
          <div className="w-full h-full flex flex-col p-3 overflow-hidden text-xs">
            {compileResult?.errors && compileResult.errors.length > 0 && (
              <div className="mb-3 space-y-1.5 max-h-48 overflow-y-auto">
                <div className="text-rose-400 font-semibold flex items-center space-x-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Found {compileResult.errors.length} compilation error(s):</span>
                </div>
                {compileResult.errors.map((err, idx) => (
                  <div
                    key={idx}
                    onClick={() => err.line && onErrorLineClick?.(err.line)}
                    className={`p-2 rounded bg-rose-950/40 border border-rose-900/60 hover:border-rose-700 transition ${
                      err.line ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-rose-300">
                      <span>{err.message}</span>
                      {err.line && (
                        <span className="bg-rose-900/80 px-1.5 py-0.5 rounded text-rose-200">
                          Line {err.line}
                        </span>
                      )}
                    </div>
                    {err.snippet && (
                      <div className="mt-1 font-mono text-[10px] text-gray-400 bg-black/40 p-1 rounded">
                        {err.snippet}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0">
              <div className="font-semibold text-gray-400 mb-1 flex items-center justify-between">
                <span>RAW COMPILATION LOG</span>
                {compileResult?.duration && (
                  <span className="text-[11px] text-gray-500">
                    Duration: {(compileResult.duration / 1000).toFixed(2)}s
                  </span>
                )}
              </div>
              <pre className="flex-1 font-mono text-[11px] leading-relaxed text-gray-300 bg-black/60 p-3 rounded border border-gray-800 overflow-auto whitespace-pre-wrap select-text">
                {compileResult?.log || 'No compilation logs yet. Click Compile PDF to build.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

