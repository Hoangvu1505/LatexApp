import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

export default function Editor({
  projectId,
  filename,
  currentUser,
  onAwarenessChange,
  editorInstanceRef,
  errors = []
}) {
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const docRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  const isImageFile = (fname) => fname && Boolean(fname.match(/\.(png|jpe?g|gif|svg|webp|ico)$/i));

  const getLanguage = (fname) => {
    if (!fname) return 'latex';
    if (fname.endsWith('.tex') || fname.endsWith('.bib') || fname.endsWith('.cls') || fname.endsWith('.sty')) {
      return 'latex';
    }
    if (fname.endsWith('.md')) return 'markdown';
    if (fname.endsWith('.json')) return 'json';
    return 'plaintext';
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorInstanceRef.current = editor;
    monacoRef.current = monaco;
    setEditorReady(true);
  };

  // Setup Yjs Real-Time Collaborative Binding
  useEffect(() => {
    if (isImageFile(filename) || !editorReady || !editorInstanceRef.current || !projectId || !filename) return;

    const editor = editorInstanceRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Clean up previous binding & provider if switching files
    if (bindingRef.current) {
      try {
        bindingRef.current.destroy();
      } catch (e) {}
      bindingRef.current = null;
    }
    if (providerRef.current) {
      try {
        providerRef.current.destroy();
      } catch (e) {}
      providerRef.current = null;
    }
    if (docRef.current) {
      try {
        docRef.current.destroy();
      } catch (e) {}
      docRef.current = null;
    }

    // Determine WebSocket host URL
    const isDevPort = window.location.port === '5173';
    const wsHost = isDevPort ? 'localhost:3001' : window.location.host;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${wsHost}/ws`;
    const roomName = `${projectId}__${filename}`;

    const doc = new Y.Doc();
    docRef.current = doc;

    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;

    // Set user awareness (name, color, avatar)
    provider.awareness.setLocalStateField('user', {
      name: currentUser?.name || 'Khách',
      color: currentUser?.color || '#3b82f6',
      email: currentUser?.email || ''
    });

    const updateCollaborators = () => {
      const states = provider.awareness.getStates();
      const collaborators = [];
      states.forEach((state, clientID) => {
        if (state.user) {
          collaborators.push({
            clientID,
            name: state.user.name,
            color: state.user.color,
            isCurrent: clientID === doc.clientID
          });
        }
      });
      if (onAwarenessChange) {
        onAwarenessChange(collaborators);
      }
    };

    provider.awareness.on('change', updateCollaborators);

    // Bind Y.Text with Monaco Model
    const yText = doc.getText('monaco');
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Initial update of collaborators
    setTimeout(updateCollaborators, 200);

    return () => {
      provider.awareness.off('change', updateCollaborators);
      try {
        binding.destroy();
        provider.destroy();
        doc.destroy();
      } catch (e) {}
      bindingRef.current = null;
      providerRef.current = null;
      docRef.current = null;
    };
  }, [projectId, filename, editorReady]);

  // Update user awareness when currentUser changes (e.g. edited name or color)
  useEffect(() => {
    if (providerRef.current) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: currentUser?.name || 'Guest',
        color: currentUser?.color || '#3b82f6',
        email: currentUser?.email || ''
      });
    }
  }, [currentUser]);

  // Highlight error lines with squiggly lines in Monaco
  useEffect(() => {
    if (!monacoRef.current || !editorInstanceRef.current) return;
    const monaco = monacoRef.current;
    const model = editorInstanceRef.current.getModel();
    if (!model) return;

    if (errors && errors.length > 0) {
      const markers = errors
        .filter((e) => e.line && typeof e.line === 'number')
        .map((err) => ({
          startLineNumber: err.line,
          endLineNumber: err.line,
          startColumn: 1,
          endColumn: 120,
          message: err.message,
          severity: monaco.MarkerSeverity.Error
        }));
      monaco.editor.setModelMarkers(model, 'latex', markers);
    } else {
      monaco.editor.setModelMarkers(model, 'latex', []);
    }
  }, [errors]);

  if (isImageFile(filename)) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181825] p-6 text-gray-400 select-none">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
          <div className="w-full h-64 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-center overflow-hidden mb-4 p-3">
            <img
              src={`/api/projects/${projectId}/files/${filename}?raw=true`}
              alt={filename}
              className="max-h-full max-w-full object-contain rounded shadow"
            />
          </div>
          <div className="font-mono text-sm text-gray-200 font-semibold mb-1 truncate max-w-full">{filename}</div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Image asset ready for inclusion in LaTeX document via:
            <code className="block mt-1 bg-gray-950 px-2 py-1 rounded text-indigo-400 font-mono text-[11px] border border-gray-800">
              {`\\includegraphics{${filename}}`}
            </code>
          </p>
          <a
            href={`/api/projects/${projectId}/files/${filename}?raw=true`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-indigo-900/30"
          >
            Open Original Image
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#181825]">
      <MonacoEditor
        height="100%"
        theme="vs-dark"
        language={getLanguage(filename)}
        options={{
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          bracketPairColorization: { enabled: true }
        }}
        onMount={handleEditorDidMount}
      />
    </div>
  );
}

