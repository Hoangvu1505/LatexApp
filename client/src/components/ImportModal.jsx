import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileArchive, 
  FileText, 
  Loader2, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export default function ImportModal({
  isOpen,
  onClose,
  onImport
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.zip') && !lowerName.endsWith('.tex')) {
      setError('Please select a valid .zip project archive or .tex file.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Auto-populate project title from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    if (!projectTitle || projectTitle === 'New Imported Project') {
      setProjectTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      await onImport(selectedFile, projectTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, ''));
      onClose();
      setSelectedFile(null);
      setProjectTitle('');
    } catch (err) {
      setError(err.message || 'Failed to import project.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-indigo-400 font-semibold text-base">
            <Upload className="w-5 h-5" />
            <span>Import LaTeX Project</span>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">
            Upload an existing project archive (<strong className="text-gray-200">.zip</strong> from Overleaf or computer) or a standalone <strong className="text-gray-200">.tex</strong> file.
          </p>

          {/* File Picker Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? 'border-indigo-500/60 bg-indigo-950/20'
                : 'border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800/40 bg-gray-950/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip,.tex"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                {selectedFile.name.endsWith('.zip') ? (
                  <FileArchive className="w-10 h-10 text-indigo-400 mb-2 animate-bounce" />
                ) : (
                  <FileText className="w-10 h-10 text-emerald-400 mb-2" />
                )}
                <div className="font-semibold text-xs text-white max-w-[280px] truncate">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {formatFileSize(selectedFile.size)} • Click to choose another file
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-indigo-400 transition" />
                <div className="text-xs font-semibold text-gray-300">
                  Click to select .zip or .tex file
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  Supports Overleaf exports and standard LaTeX projects (up to 50MB)
                </div>
              </div>
            )}
          </div>

          {/* Project Title Input */}
          <div>
            <label className="text-xs font-medium text-gray-300 block mb-1.5">
              Project Name:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My Research Paper"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none transition"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-full text-xs font-semibold shadow-lg shadow-indigo-900/30 transition flex items-center space-x-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

