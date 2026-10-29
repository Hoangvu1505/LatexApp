import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  FileArchive, 
  Users, 
  Share2, 
  MessageSquare, 
  FolderPlus, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Edit2,
  LogIn,
  User,
  ArrowLeft
} from 'lucide-react';

export default function Header({
  project,
  projects,
  onSelectProject,
  onNewProject,
  onBackToDashboard,
  onCompile,
  isCompiling,
  compileResult,
  activeUsers,
  currentUser,
  onChangeCurrentUser,
  onDownloadPdf,
  onDownloadZip,
  onOpenShare,
  onToggleChat,
  onOpenAuth,
  isChatOpen,
  hasPdf
}) {
  const [showProjectsList, setShowProjectsList] = useState(false);

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 px-4 flex items-center justify-between relative z-20 text-sm select-none">
      {/* Left: Brand & Back to Dashboard */}
      <div className="flex items-center space-x-3 z-10">
        <button
          onClick={onBackToDashboard}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-medium transition shadow-sm group"
          title="Back to Projects"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
          <div className="flex items-center space-x-1.5">
            <span className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-[10px] flex items-center justify-center">
              TeX
            </span>
            <span className="font-semibold text-white">LaTeX</span>
          </div>
        </button>

        <div className="h-5 w-[1px] bg-gray-800" />

        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setShowProjectsList(!showProjectsList)}
            className="flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition"
          >
            <span className="max-w-[150px] md:max-w-[220px] truncate font-medium text-xs">
              {project?.title || 'Loading...'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProjectsList && (
            <div className="absolute left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 border-b border-gray-700 flex justify-between items-center">
                <span>PROJECTS</span>
                <button
                  onClick={() => {
                    setShowProjectsList(false);
                    onNewProject();
                  }}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ New</span>
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p.id);
                      setShowProjectsList(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-700 transition flex items-center justify-between ${
                      p.id === project?.id ? 'text-indigo-400 bg-gray-700/50' : 'text-gray-300'
                    }`}
                  >
                    <span className="truncate">{p.title}</span>
                    {p.hasPdf && <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">PDF</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Absolute Geometric Center: Compile Action & Status */}
      <div className="absolute left-[55%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2.5 z-20 pointer-events-auto">
        <button
          onClick={onCompile}
          disabled={isCompiling}
          className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold text-xs tracking-wide transition shadow-lg ${
            isCompiling
              ? 'bg-indigo-600/60 text-white cursor-not-allowed shadow-none'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-900/50 hover:shadow-indigo-900/70 ring-1 ring-indigo-400/30'
          }`}
          title="Compile LaTeX source to PDF (Shortcut: Ctrl + S or F5)"
        >
          {isCompiling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Compile PDF</span>
            </>
          )}
        </button>

        {compileResult && (
          <div className="hidden xl:flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-700 bg-gray-800/90 shadow">
            {compileResult.success ? (
              <span className="flex items-center text-emerald-400 space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success ({((compileResult.duration || 0) / 1000).toFixed(1)}s)</span>
              </span>
            ) : (
              <span className="flex items-center text-rose-400 space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{compileResult.errors?.length || 1} error(s)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Real-time Collaborators, User Profile */}
      <div className="flex items-center space-x-2 z-10">
        {/* Collaborators Avatar Stack */}
        <div className="flex items-center mr-3">
          <div className="flex items-center -space-x-1.5">
            {activeUsers.slice(0, 6).map((u, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-gray-900 flex items-center justify-center text-[11px] font-bold text-white shadow shrink-0"
                style={{ backgroundColor: u.color || '#6366f1' }}
                title={`${u.name}${u.isCurrent ? ' (You)' : ''}`}
              >
                {(u.name || 'U')[0].toUpperCase()}
              </div>
            ))}
            {activeUsers.length > 6 && (
              <div className="w-7 h-7 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">
                +{activeUsers.length - 6}
              </div>
            )}
          </div>
          <span className="ml-2 text-xs text-gray-400 hidden xl:inline shrink-0">
            {activeUsers.length || 1} online
          </span>
        </div>

        {/* User Account / Google Login Button */}
        {currentUser?.email ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 transition"
            title={`Signed in as: ${currentUser.email}. Click to view account or sign out.`}
          >
            {currentUser.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: currentUser.color }}
              >
                {currentUser.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="max-w-[110px] truncate text-xs font-medium">{currentUser.name}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-900/40 transition"
            title="Sign in with Google or Email"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}

        {/* Share Invite Link */}
        <button
          onClick={onOpenShare}
          className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition"
          title="Share project with collaborators"
        >
          <Share2 className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Download PDF */}
        <button
          onClick={onDownloadPdf}
          disabled={!hasPdf}
          className={`p-1.5 rounded-md border border-gray-700 transition ${
            hasPdf 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
              : 'bg-gray-800/40 text-gray-600 cursor-not-allowed'
          }`}
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Download ZIP */}
        <button
          onClick={onDownloadZip}
          className="p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 transition"
          title="Download Project Archive (.zip)"
        >
          <FileArchive className="w-4 h-4" />
        </button>

        {/* Chat Drawer Toggle */}
        <button
          onClick={onToggleChat}
          className={`p-1.5 rounded-md border transition ${
            isChatOpen 
              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' 
              : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
          }`}
          title="Toggle Team Discussion"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

