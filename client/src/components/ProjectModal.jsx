import React, { useState } from 'react';
import { X, FolderPlus, FileText, Presentation, BookOpen, FileCode } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, onCreateProject }) {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('standard');

  if (!isOpen) return null;

  const templates = [
    {
      id: 'standard',
      name: 'Research Article / Paper',
      desc: 'Standard academic paper layout with math, tables, and theorem environments.',
      icon: <FileText className="w-4 h-4 text-indigo-400" />
    },
    {
      id: 'report',
      name: 'Technical Report / Thesis',
      desc: 'Multi-chapter document layout with preconfigured table of contents.',
      icon: <BookOpen className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'beamer',
      name: 'Presentation Slides (Beamer)',
      desc: 'Modern slide deck template with frame themes and slide transitions.',
      icon: <Presentation className="w-4 h-4 text-amber-400" />
    },
    {
      id: 'blank',
      name: 'Blank Document',
      desc: 'Minimal clean TeX file to build your document from scratch.',
      icon: <FileCode className="w-4 h-4 text-gray-400" />
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateProject(title.trim(), template);
      setTitle('');
      setTemplate('standard');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-base">
            <FolderPlus className="w-5 h-5" />
            <span>Create New LaTeX Project</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="text-gray-300 font-semibold block mb-1.5">
              Project Title:
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Machine Learning Research Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="text-gray-300 font-semibold block mb-2">
              Select a Starter Template:
            </label>
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start space-x-3 ${
                    template === t.id
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200'
                      : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{t.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-200 text-xs">{t.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-900/40 transition"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
