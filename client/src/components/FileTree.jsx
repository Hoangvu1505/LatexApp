import React, { useState, useRef } from 'react';
import { 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Upload, 
  ChevronRight, 
  ChevronDown,
  FolderOpen
} from 'lucide-react';

export default function FileTree({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onUploadFile
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      let finalName = newFileName.trim();
      if (!finalName.includes('.')) {
        finalName += '.tex';
      }
      onCreateFile(finalName);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      e.target.value = '';
    }
  };

  const getFileIcon = (name) => {
    if (name.endsWith('.tex')) return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (name.endsWith('.bib')) return <FileText className="w-4 h-4 text-amber-400" />;
    if (name.endsWith('.pdf')) return <FileText className="w-4 h-4 text-rose-400" />;
    if (name.match(/\.(png|jpg|jpeg|gif|svg)$/i)) return <ImageIcon className="w-4 h-4 text-cyan-400" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="w-56 bg-gray-950 border-r border-gray-800 flex flex-col h-full select-none text-sm">
      {/* Sidebar Header */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-gray-800 text-xs font-semibold text-gray-400">
        <span className="flex items-center space-x-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>PROJECT FILES</span>
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition"
            title="New file (.tex, .bib)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition"
            title="Upload file or image"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* New file input form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-gray-800 bg-gray-900">
          <input
            type="text"
            autoFocus
            placeholder="Filename (e.g. chapter1.tex)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={() => !newFileName && setIsCreating(false)}
            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          />
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {files
          .filter((f) => f.name !== 'meta.json' && !f.name.endsWith('.pdf'))
          .map((file) => {
            const isActive = file.name === activeFile;
            return (
              <div
                key={file.name}
                onClick={() => onSelectFile(file.name)}
                className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs transition ${
                  isActive
                    ? 'bg-indigo-950/60 text-indigo-300 border-l-2 border-indigo-500'
                    : 'text-gray-300 hover:bg-gray-900 hover:text-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  {getFileIcon(file.name)}
                  <span className="truncate">{file.name}</span>
                </div>

                {file.name !== 'main.tex' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete file "${file.name}"?`)) {
                        onDeleteFile(file.name);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-gray-500 transition"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

