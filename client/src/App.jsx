import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header.jsx';
import FileTree from './components/FileTree.jsx';
import Toolbar from './components/Toolbar.jsx';
import Editor from './components/Editor.jsx';
import PdfViewer from './components/PdfViewer.jsx';
import ChatDrawer from './components/ChatDrawer.jsx';
import ShareModal from './components/ShareModal.jsx';
import ProjectModal from './components/ProjectModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import Dashboard from './components/Dashboard.jsx';
import { COLLABORATOR_COLORS, getColorForEmail } from './utils/userColors.js';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState('main.tex');

  // 'dashboard' or 'editor'
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('project') ? 'editor' : 'dashboard';
  });

  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [googleClientId, setGoogleClientId] = useState(null);
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  const editorInstanceRef = useRef(null);

  // Initialize current user from URL query or localStorage (no mock user generation)
  const [currentUser, setCurrentUser] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const queryUser = params.get('user');
    if (queryUser) {
      const color = getColorForEmail(queryUser);
      return { 
        name: queryUser, 
        email: `${queryUser.toLowerCase().replace(/\s+/g, '')}@gmail.com`, 
        color 
      };
    }
    const saved = localStorage.getItem('latex_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u && u.email) return u;
      } catch (e) {}
    }
    return null;
  });

  const handleUpdateCurrentUser = (newUser) => {
    setCurrentUser(newUser);
    if (newUser) {
      localStorage.setItem('latex_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('latex_user');
    }
  };

  const handleLoginSuccess = (userData) => {
    handleUpdateCurrentUser(userData);
    setCurrentView('dashboard');
    fetchProjects(userData.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('latex_user');
    setCurrentUser(null);
    setCurrentView('dashboard');
    fetchProjects('');
  };

  // Fetch Auth & Mail configuration from server
  useEffect(() => {
    fetch('/api/config/auth')
      .then((res) => res.json())
      .then((data) => {
        setGoogleClientId(data.googleClientId);
        setSmtpConfigured(data.smtpConfigured);
      })
      .catch((err) => console.error('Lỗi cấu hình Auth:', err));
  }, []);

  // 1. Fetch Projects List
  const fetchProjects = useCallback(async (userEmail = '') => {
    try {
      const emailParam = userEmail || currentUser?.email || '';
      const url = emailParam
        ? `/api/projects?userEmail=${encodeURIComponent(emailParam)}`
        : '/api/projects';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);

        const params = new URLSearchParams(window.location.search);
        const queryProject = params.get('project');

        if (queryProject && data.projects.some((p) => p.id === queryProject)) {
          setActiveProjectId(queryProject);
          setCurrentView('editor');
        } else if (!activeProjectId && data.projects.length > 0) {
          setActiveProjectId(data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách dự án:', err);
    }
  }, [currentUser?.email, activeProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 2. Fetch Project Details & File List
  const fetchProjectDetails = useCallback(
    async (projId) => {
      if (!projId) return;
      try {
        const res = await fetch(`/api/projects/${projId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentProject(data.project);
          setFiles(data.files || []);

          if (data.hasPdf) {
            setPdfUrl(`/api/projects/${projId}/pdf?t=${Date.now()}`);
          } else {
            setPdfUrl(null);
          }

          // Ensure activeFile exists
          if (!data.files.some((f) => f.name === activeFile)) {
            setActiveFile('main.tex');
          }
        }
      } catch (err) {
        console.error('Lỗi chi tiết dự án:', err);
      }
    },
    [activeFile]
  );

  useEffect(() => {
    if (activeProjectId && currentView === 'editor') {
      fetchProjectDetails(activeProjectId);
    }
  }, [activeProjectId, currentView, fetchProjectDetails]);

  // 3. Compile LaTeX
  const handleCompile = async () => {
    if (!activeProjectId || isCompiling) return;
    setIsCompiling(true);

    try {
      const res = await fetch(`/api/projects/${activeProjectId}/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainFile: 'main.tex' })
      });

      const data = await res.json();
      setCompileResult(data);

      if (data.success && data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
      }
      fetchProjectDetails(activeProjectId);
    } catch (err) {
      console.error('Lỗi khi biên dịch:', err);
      setCompileResult({
        success: false,
        duration: 0,
        log: err.message,
        errors: [{ message: err.message, line: null }]
      });
    } finally {
      setIsCompiling(false);
    }
  };

  // Keyboard shortcut: Ctrl + S or F5 to compile
  useEffect(() => {
    if (currentView !== 'editor') return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === 's') || e.key === 'F5') {
        e.preventDefault();
        handleCompile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProjectId, isCompiling, currentView]);

  // 4. File Management Operations
  const handleCreateFile = async (name) => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/files/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '' })
      });
      if (res.ok) {
        await fetchProjectDetails(activeProjectId);
        setActiveFile(name);
      }
    } catch (err) {
      console.error('Lỗi tạo file:', err);
    }
  };

  const handleDeleteFile = async (name) => {
    if (!activeProjectId) return;
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/files/${name}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchProjectDetails(activeProjectId);
        if (activeFile === name) {
          setActiveFile('main.tex');
        }
      }
    } catch (err) {
      console.error('Lỗi xóa file:', err);
    }
  };

  const handleUploadFile = async (file) => {
    if (!activeProjectId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await fetchProjectDetails(activeProjectId);
      }
    } catch (err) {
      console.error('Lỗi tải file lên:', err);
    }
  };

  // 5. Create New Project (requires logged-in user)
  const handleCreateProject = async (title, template = 'standard') => {
    if (!currentUser?.email) {
      setIsAuthOpen(true);
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          template,
          owner: {
            name: currentUser.name || currentUser.email.split('@')[0],
            email: currentUser.email.trim().toLowerCase()
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchProjects();
        setActiveProjectId(data.project.id);
        setCurrentView('editor');
      }
    } catch (err) {
      console.error('Lỗi khởi tạo dự án:', err);
    }
  };

  // 5.1 Delete Project
  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProjects();
        if (activeProjectId === id) {
          setActiveProjectId(null);
        }
      }
    } catch (err) {
      console.error('Lỗi xóa dự án:', err);
    }
  };

  // 6. Insert Snippet to Monaco Editor
  const handleInsertSnippet = (snippet) => {
    const editor = editorInstanceRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const id = { major: 1, minor: 1 };
    const op = { identifier: id, range: selection, text: snippet, forceMoveMarkers: true };
    editor.executeEdits('toolbar-insert', [op]);
    editor.focus();
  };

  // 7. Jump to Error Line
  const handleErrorLineClick = (line) => {
    const editor = editorInstanceRef.current;
    if (!editor || !line) return;
    editor.revealLineInCenter(line);
    editor.setPosition({ lineNumber: line, column: 1 });
    editor.focus();
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      {currentView === 'dashboard' ? (
        /* Workspace / Personal Dashboard View */
        <Dashboard
          projects={projects}
          currentUser={currentUser}
          onOpenProject={(id) => {
            setActiveProjectId(id);
            setCurrentView('editor');
          }}
          onNewProject={() => {
            if (!currentUser) {
              setIsAuthOpen(true);
            } else {
              setIsProjectModalOpen(true);
            }
          }}
          onDeleteProject={handleDeleteProject}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      ) : (
        /* Editor Studio View */
        <div className="flex flex-col h-full w-full">
          {/* Top Navigation Bar */}
          <Header
            project={currentProject}
            projects={projects}
            onSelectProject={(id) => setActiveProjectId(id)}
            onNewProject={() => {
              if (!currentUser?.email) {
                setIsAuthOpen(true);
              } else {
                setIsProjectModalOpen(true);
              }
            }}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onCompile={handleCompile}
            isCompiling={isCompiling}
            compileResult={compileResult}
            activeUsers={activeCollaborators}
            currentUser={currentUser}
            onChangeCurrentUser={handleUpdateCurrentUser}
            onDownloadPdf={() => window.open(`/api/projects/${activeProjectId}/pdf`, '_blank')}
            onDownloadZip={() => window.open(`/api/projects/${activeProjectId}/zip`, '_blank')}
            onOpenShare={() => setIsShareOpen(true)}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onOpenAuth={() => setIsAuthOpen(true)}
            isChatOpen={isChatOpen}
            hasPdf={!!pdfUrl}
          />

          {/* Main Workspace Body */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left: Project File Tree */}
            <FileTree
              files={files}
              activeFile={activeFile}
              onSelectFile={(f) => setActiveFile(f)}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onUploadFile={handleUploadFile}
            />

            {/* Center: Editor Column */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800">
              {/* Quick LaTeX Formatting Toolbar */}
              <Toolbar onInsert={handleInsertSnippet} />

              {/* Collaborative Monaco Editor */}
              <div className="flex-1 relative overflow-hidden">
                <Editor
                  projectId={activeProjectId}
                  filename={activeFile}
                  currentUser={currentUser}
                  onAwarenessChange={setActiveCollaborators}
                  editorInstanceRef={editorInstanceRef}
                  errors={compileResult?.errors || []}
                />
              </div>
            </div>

            {/* Right: PDF Viewer & Diagnostics Column */}
            <div className="w-[45%] flex flex-col min-w-[320px] max-w-[800px]">
              <PdfViewer
                pdfUrl={pdfUrl}
                isCompiling={isCompiling}
                compileResult={compileResult}
                onCompile={handleCompile}
                onErrorLineClick={handleErrorLineClick}
              />
            </div>

            {/* Side Slide-out Chat Drawer */}
            <ChatDrawer
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              projectId={activeProjectId}
              currentUser={currentUser}
              activeUsers={activeCollaborators}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectId={activeProjectId}
        projectTitle={currentProject?.title}
        currentUser={currentUser}
        smtpConfigured={smtpConfigured}
      />

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        googleClientId={googleClientId}
      />
    </div>
  );
}
