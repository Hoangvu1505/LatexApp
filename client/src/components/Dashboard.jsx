import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  Download, 
  FileArchive, 
  Trash2, 
  Users, 
  Folder, 
  Layers, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  ArrowUpDown, 
  LogIn, 
  LogOut, 
  FileCode, 
  CheckCircle2, 
  PanelLeftClose, 
  PanelLeftOpen,
  ArrowRight
} from 'lucide-react';

export default function Dashboard({
  projects = [],
  currentUser,
  onOpenProject,
  onNewProject,
  onOpenImport,
  onDeleteProject,
  onOpenAuth,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'shared'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const userEmail = (currentUser?.email || '').trim().toLowerCase();

  // Categorize projects strictly based on user email (no anonymous projects)
  const myProjects = projects.filter((p) => {
    if (!userEmail) return false;
    const ownerEmail = (p.owner?.email || '').trim().toLowerCase();
    return ownerEmail === userEmail || p.isOwner;
  });

  const sharedProjects = projects.filter((p) => {
    if (!userEmail) return false;
    const isCollab = (p.collaborators || []).some(
      (c) => (c.email || '').trim().toLowerCase() === userEmail
    );
    return isCollab || p.isCollaborator;
  });

  let displayedProjects = activeTab === 'mine' ? myProjects : sharedProjects;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedProjects = displayedProjects.filter(
      (p) => (p.title || '').toLowerCase().includes(q) || (p.id || '').toLowerCase().includes(q)
    );
  }

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-100 font-sans overflow-hidden select-none">
      {/* Left Dark Sidebar with Indigo & Slate Palette */}
      <aside
        className={`${
          isSidebarOpen ? 'w-60' : 'w-16'
        } bg-gray-900 border-r border-gray-800 flex flex-col justify-between transition-all duration-200 shrink-0 z-20`}
      >
        {/* Sidebar Top: Logo & Nav Items */}
        <div className="p-3">
          <div className="flex items-center justify-between px-2 py-2 mb-4">
            <div className="flex items-center space-x-2.5">
              {/* TeX-LaTeX Brand Icon */}
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-indigo-950 shrink-0">
                TeX
              </div>
              {isSidebarOpen && (
                <span className="font-bold text-sm tracking-tight text-white">
                  TeX<span className="text-indigo-400">-LaTeX</span>
                </span>
              )}
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('mine')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'mine'
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent'
              }`}
            >
              <Folder className="w-4 h-4 shrink-0 text-indigo-400" />
              {isSidebarOpen && <span>Your Projects</span>}
            </button>

            <button
              onClick={() => setActiveTab('shared')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'shared'
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-indigo-400" />
              {isSidebarOpen && <span>Shared with you</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom: Sign In / User Profile */}
        <div className="p-3 border-t border-gray-800">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-800/80 border border-gray-700/80">
              <div className="flex items-center space-x-2.5 min-w-0">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-indigo-500/40"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow"
                    style={{ backgroundColor: currentUser.color || '#6366f1' }}
                  >
                    {currentUser.name[0]?.toUpperCase()}
                  </div>
                )}
                {isSidebarOpen && (
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-gray-400 truncate">{currentUser.email}</div>
                  </div>
                )}
              </div>

              {isSidebarOpen && (
                <button
                  onClick={onLogout}
                  className="p-1 hover:text-rose-400 text-gray-400 transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-indigo-500/40 text-gray-300 hover:text-white transition group"
              title="Sign in or register"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-5 h-5 rounded-full border border-gray-600 flex items-center justify-center shrink-0 group-hover:border-indigo-400 group-hover:text-indigo-400 transition">
                  <LogIn className="w-3 h-3 text-gray-400 group-hover:text-indigo-400" />
                </div>
                {isSidebarOpen && <span className="font-medium text-white truncate">Sign in</span>}
              </div>
              {isSidebarOpen && <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-white shrink-0" />}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950">
        {/* Top Navbar */}
        <header className="h-16 px-8 flex items-center justify-between border-b border-gray-800 bg-gray-900/60 backdrop-blur-md shrink-0">
          <h2 className="text-lg font-semibold text-white tracking-tight flex items-center space-x-2">
            <span>{activeTab === 'mine' ? 'Your Projects' : 'Shared with you'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 font-normal">
              {displayedProjects.length}
            </span>
          </h2>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-900/90 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-full pl-8 pr-4 py-1.5 text-xs text-white placeholder-gray-500 w-64 focus:outline-none transition shadow-inner"
              />
            </div>

            {/* List / Grid view toggles */}
            <div className="flex items-center space-x-1 p-1 bg-gray-900/90 border border-gray-800 rounded-full">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-full transition ${
                  viewMode === 'list' ? 'bg-gray-800 text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-full transition ${
                  viewMode === 'grid' ? 'bg-gray-800 text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Import Button */}
            <button
              onClick={() => {
                if (!currentUser && onOpenAuth) onOpenAuth();
                else onOpenImport?.();
              }}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-medium px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 transition shadow-sm hover:border-indigo-500/40"
              title="Import project from ZIP archive or .tex file"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Import</span>
            </button>

            {/* + New Button */}
            <button
              onClick={() => {
                if (!currentUser && onOpenAuth) onOpenAuth();
                else onNewProject();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center space-x-1 shadow-md shadow-indigo-900/40 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {displayedProjects.length === 0 ? (
            /* Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center -mt-10">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-3 shadow-inner shadow-indigo-900/40">
                <FileCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1.5">
                {activeTab === 'shared' ? 'No shared projects yet' : "You don't have any projects yet"}
              </h3>
              <p className="text-xs text-gray-400 mb-6 max-w-sm">
                {activeTab === 'shared'
                  ? 'When someone invites you via email, shared projects will appear here.'
                  : 'Start a collaborative scientific document on TeX-LaTeX'}
              </p>
              <button
                onClick={() => {
                  if (!currentUser && onOpenAuth) onOpenAuth();
                  else onNewProject();
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-indigo-900/40 transition hover:scale-[1.02] active:scale-[0.98] flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Start from Scratch</span>
              </button>
            </div>
          ) : viewMode === 'list' ? (
            /* Table / List View */
            <div className="w-full">
              <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-medium text-gray-400 border-b border-gray-800">
                <div className="col-span-6 flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
                <div className="col-span-3 flex items-center space-x-1">
                  <span>Created</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
                <div className="col-span-2">Owner</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y divide-gray-800/40 mt-1">
                {displayedProjects.map((p) => {
                  const isOwner =
                    !p.owner?.email ||
                    (userEmail && (p.owner?.email || '').toLowerCase() === userEmail) ||
                    p.isOwner;

                  return (
                    <div
                      key={p.id}
                      onClick={() => onOpenProject(p.id)}
                      className="grid grid-cols-12 px-4 py-3.5 text-xs text-gray-200 hover:bg-gray-900/90 border border-transparent hover:border-gray-800/80 rounded-xl cursor-pointer transition items-center group"
                    >
                      {/* Name */}
                      <div className="col-span-6 flex items-center space-x-3 truncate pr-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shrink-0 group-hover:bg-indigo-900/60 group-hover:border-indigo-600/50 transition">
                          <FileCode className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="font-medium group-hover:text-white truncate block">
                            {p.title || 'Untitled Project'}
                          </span>
                          <span className="text-[10px] text-gray-400">{p.fileCount || 1} files</span>
                        </div>
                        {p.hasPdf && (
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full shrink-0 font-medium">
                            PDF
                          </span>
                        )}
                      </div>

                      {/* Created / Updated */}
                      <div className="col-span-3 text-gray-400 text-[11px]">
                        {formatDate(p.updatedAt || p.createdAt)}
                      </div>

                      {/* Owner */}
                      <div className="col-span-2 text-gray-400 text-[11px] truncate">
                        {isOwner ? (
                          <span className="text-indigo-300 font-medium">You</span>
                        ) : (
                          <span>{p.owner?.name || p.owner?.email || 'Collaborator'}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end space-x-1">
                        {p.hasPdf && (
                          <a
                            href={`/api/projects/${p.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-800 rounded-md transition"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <a
                          href={`/api/projects/${p.id}/zip`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-800 rounded-md transition"
                          title="Download ZIP"
                        >
                          <FileArchive className="w-3.5 h-3.5" />
                        </a>

                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete project "${p.title}"?`)) {
                                onDeleteProject(p.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-gray-800 rounded-md transition"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onOpenProject(p.id)}
                  className="bg-gray-900/70 hover:bg-gray-900 border border-gray-800 hover:border-indigo-500/40 rounded-2xl p-5 cursor-pointer transition shadow-lg shadow-black/20 hover:shadow-indigo-950/20 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 text-[11px] text-gray-400">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition">
                        <FileCode className="w-4 h-4" />
                      </div>
                      {p.hasPdf && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800/80 font-medium">
                          PDF
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1 truncate group-hover:text-indigo-300 transition">
                      {p.title}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Author: {p.owner?.name || p.owner?.email || 'You'} • {p.fileCount || 1} files
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-800 text-xs">
                    <span className="text-[10px] text-gray-400">{formatDate(p.updatedAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProject(p.id);
                      }}
                      className="text-indigo-400 group-hover:text-indigo-300 flex items-center space-x-1 font-medium text-xs transition"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
