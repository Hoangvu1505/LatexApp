import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import multer from 'multer';
import AdmZip from 'adm-zip';
import { WebSocketServer } from 'ws';
import { setupWSConnection, getYDoc } from 'y-websocket/bin/utils';
import { fileURLToPath } from 'url';
import { compileLatex, sanitizeLatexSource } from './compiler.js';
import { 
  DEFAULT_MAIN_TEX, 
  BLANK_MAIN_TEX, 
  REPORT_MAIN_TEX, 
  BEAMER_MAIN_TEX, 
  DEFAULT_README 
} from './template.js';
import { sendProjectInvitation, isSmtpConfigured, GOOGLE_CLIENT_ID } from './mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const PROJECTS_ROOT = path.resolve(__dirname, '../projects');

// Ensure root projects directory exists
fs.ensureDirSync(PROJECTS_ROOT);

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const projDir = path.join(PROJECTS_ROOT, req.params.id);
      fs.ensureDirSync(projDir);
      cb(null, projDir);
    },
    filename: (req, file, cb) => {
      // Preserve original file name
      cb(null, file.originalname);
    }
  })
});

// Configure memory storage multer for project imports (.zip, .tex)
const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Memory cache for project chat messages: projectId -> Array<Message>
const projectChats = new Map();

// Track observed YDocs to avoid duplicate observers
const observedDocs = new Set();

/**
 * Helper to ensure a YDoc is initialized from disk if empty,
 * and sets up debounced auto-save to disk.
 */
function ensureDocLoadedAndSynced(projectId, fileName) {
  const docName = `${projectId}__${fileName}`;
  const doc = getYDoc(docName);
  const yText = doc.getText('monaco');

  const filePath = path.join(PROJECTS_ROOT, projectId, fileName);

  if (yText.length === 0 && fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      yText.insert(0, content);
      console.log(`[YDoc Sync] Đã nạp nội dung từ disk cho: ${docName} (${content.length} bytes)`);
    } catch (e) {
      console.error(`[YDoc Sync Error] Không thể đọc file ${filePath}:`, e);
    }
  }

  if (!observedDocs.has(docName)) {
    observedDocs.add(docName);
    let debounceTimer = null;
    yText.observe(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        try {
          fs.ensureDirSync(path.dirname(filePath));
          fs.writeFileSync(filePath, yText.toString(), 'utf-8');
          console.log(`[Auto-save] Đã lưu file ${fileName} của dự án ${projectId}`);
        } catch (err) {
          console.error(`[Auto-save Error] Lỗi lưu file:`, err);
        }
      }, 1000);
    });
  }

  return { doc, yText, docName };
}

/**
 * Flush all memory YDocs belonging to this project directly to disk
 * and auto-sanitize TeX files for Unicode/XeTeX compatibility
 */
function flushProjectDocsToDisk(projectId) {
  const prefix = `${projectId}__`;
  const projDir = path.join(PROJECTS_ROOT, projectId);
  if (!fs.existsSync(projDir)) return;

  const files = fs.readdirSync(projDir);
  for (const file of files) {
    const docName = `${prefix}${file}`;
    const doc = getYDoc(docName);
    const yText = doc.getText('monaco');
    if (yText.length > 0) {
      let content = yText.toString();

      // Auto-adapt legacy fontenc T5 to fontspec so Vietnamese renders flawlessly
      if (file.endsWith('.tex')) {
        const { content: sanitized, changed } = sanitizeLatexSource(content);
        if (changed) {
          console.log(`[Auto-Sanitize] Đã tự động cập nhật fontspec cho ${docName}`);
          yText.delete(0, yText.length);
          yText.insert(0, sanitized);
          content = sanitized;
        }
      }

      const filePath = path.join(projDir, file);
      try {
        fs.writeFileSync(filePath, content, 'utf-8');
      } catch (err) {
        console.error(`[Flush Error]`, err);
      }
    }
  }
}

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Get all projects (filtered strictly by user ownership / shared; no anonymous projects)
app.get('/api/projects', async (req, res) => {
  try {
    const { userEmail = '' } = req.query;
    const normalizedEmail = (userEmail || '').trim().toLowerCase();

    // If user is not logged in, return empty projects list
    if (!normalizedEmail) {
      return res.json({ projects: [] });
    }

    const entries = await fs.readdir(PROJECTS_ROOT, { withFileTypes: true });
    const projects = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metaPath = path.join(PROJECTS_ROOT, entry.name, 'meta.json');
        let meta = {
          id: entry.name,
          title: entry.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          owner: null,
          collaborators: []
        };

        if (await fs.pathExists(metaPath)) {
          try {
            meta = { ...meta, ...(await fs.readJson(metaPath)) };
          } catch (e) {}
        }

        const ownerEmail = (meta.owner?.email || '').trim().toLowerCase();
        // Skip unowned / anonymous projects
        if (!ownerEmail) continue;

        const isOwner = ownerEmail === normalizedEmail;
        const isCollaborator = (meta.collaborators || []).some(
          (c) => (c.email || '').trim().toLowerCase() === normalizedEmail
        );

        // Only include if owner or collaborator
        if (!isOwner && !isCollaborator) continue;

        const files = await fs.readdir(path.join(PROJECTS_ROOT, entry.name));

        projects.push({
          ...meta,
          fileCount: files.filter((f) => !f.endsWith('.pdf') && f !== 'meta.json').length,
          hasPdf: files.some((f) => f.endsWith('.pdf')),
          isOwner: Boolean(isOwner),
          isCollaborator: Boolean(isCollaborator)
        });
      }
    }

    // Sort by updatedAt descending
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create project with chosen template and owner
app.post('/api/projects', async (req, res) => {
  try {
    const { 
      title = 'Dự án LaTeX Mới', 
      id: customId, 
      template = 'standard',
      owner = null 
    } = req.body;

    // Reject anonymous creation
    if (!owner || !owner.email || !owner.email.trim()) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để tạo và lưu dự án.' });
    }

    const id = customId || `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const projDir = path.join(PROJECTS_ROOT, id);

    await fs.ensureDir(projDir);

    let initialTex = DEFAULT_MAIN_TEX;
    if (template === 'blank') initialTex = BLANK_MAIN_TEX;
    else if (template === 'report') initialTex = REPORT_MAIN_TEX;
    else if (template === 'beamer') initialTex = BEAMER_MAIN_TEX;

    // Initial files
    await fs.writeFile(path.join(projDir, 'main.tex'), initialTex, 'utf-8');
    await fs.writeFile(path.join(projDir, 'README.md'), DEFAULT_README, 'utf-8');

    const meta = {
      id,
      title,
      template,
      owner: {
        name: owner.name || owner.email.split('@')[0],
        email: owner.email.trim().toLowerCase()
      },
      collaborators: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await fs.writeJson(path.join(projDir, 'meta.json'), meta, { spaces: 2 });

    // Pre-populate YDoc
    ensureDocLoadedAndSynced(id, 'main.tex');

    res.status(201).json({ success: true, project: meta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2.1 Import project from ZIP archive or single .tex file
app.post('/api/projects/import', uploadImport.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded for import.' });
    }

    let owner = null;
    if (req.body.owner) {
      try {
        owner = typeof req.body.owner === 'string' ? JSON.parse(req.body.owner) : req.body.owner;
      } catch (e) {}
    }

    if (!owner || !owner.email || !owner.email.trim()) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập để nhập và lưu dự án.' });
    }

    const originalName = req.file.originalname;
    const baseTitle = req.body.title?.trim() || path.parse(originalName).name || 'Imported Project';
    const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const projDir = path.join(PROJECTS_ROOT, id);

    await fs.ensureDir(projDir);

    if (originalName.toLowerCase().endsWith('.zip')) {
      const zip = new AdmZip(req.file.buffer);
      const zipEntries = zip.getEntries();

      // Check for a common root folder in the archive (e.g., project-folder/main.tex)
      let commonRoot = '';
      const firstValid = zipEntries.find((e) => !e.isDirectory && !e.entryName.startsWith('__MACOSX/'));
      if (firstValid) {
        const slashIdx = firstValid.entryName.indexOf('/');
        if (slashIdx > 0) {
          const candidate = firstValid.entryName.substring(0, slashIdx + 1);
          const allMatch = zipEntries.every(
            (e) => e.entryName.startsWith(candidate) || e.entryName.startsWith('__MACOSX/')
          );
          if (allMatch) commonRoot = candidate;
        }
      }

      for (const entry of zipEntries) {
        if (entry.isDirectory || entry.entryName.startsWith('__MACOSX/')) continue;
        let relativePath = entry.entryName;
        if (commonRoot && relativePath.startsWith(commonRoot)) {
          relativePath = relativePath.substring(commonRoot.length);
        }
        const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '');
        if (!safePath || safePath.startsWith('.')) continue;

        const targetPath = path.join(projDir, safePath);
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, entry.getData());
      }

      // Check main.tex presence
      const files = await fs.readdir(projDir);
      if (!files.includes('main.tex')) {
        const anyTex = files.find((f) => f.toLowerCase().endsWith('.tex'));
        if (anyTex) {
          await fs.copy(path.join(projDir, anyTex), path.join(projDir, 'main.tex'));
        } else {
          await fs.writeFile(path.join(projDir, 'main.tex'), DEFAULT_MAIN_TEX, 'utf-8');
        }
      }
    } else if (originalName.toLowerCase().endsWith('.tex')) {
      const texContent = req.file.buffer.toString('utf-8');
      await fs.writeFile(path.join(projDir, 'main.tex'), texContent, 'utf-8');
      await fs.writeFile(path.join(projDir, 'README.md'), DEFAULT_README, 'utf-8');
    } else {
      return res.status(400).json({ error: 'Định dạng file không được hỗ trợ. Vui lòng chọn file .zip hoặc .tex.' });
    }

    const meta = {
      id,
      title: baseTitle,
      template: 'imported',
      owner: {
        name: owner.name || owner.email.split('@')[0],
        email: owner.email.trim().toLowerCase()
      },
      collaborators: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await fs.writeJson(path.join(projDir, 'meta.json'), meta, { spaces: 2 });

    // Pre-populate YDoc
    ensureDocLoadedAndSynced(id, 'main.tex');

    res.status(201).json({ success: true, project: meta });
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2.2 Delete a project entirely
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projDir = path.join(PROJECTS_ROOT, id);

    if (await fs.pathExists(projDir)) {
      await fs.remove(projDir);
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get project details and file list
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projDir = path.join(PROJECTS_ROOT, id);

    if (!(await fs.pathExists(projDir))) {
      return res.status(404).json({ error: 'Dự án không tồn tại' });
    }

    const metaPath = path.join(projDir, 'meta.json');
    let meta = { id, title: id };
    if (await fs.pathExists(metaPath)) {
      meta = await fs.readJson(metaPath);
    }

    const items = await fs.readdir(projDir, { withFileTypes: true });
    const files = items.map((item) => {
      const stats = fs.statSync(path.join(projDir, item.name));
      return {
        name: item.name,
        isDirectory: item.isDirectory(),
        size: stats.size,
        updatedAt: stats.mtime
      };
    });

    const hasPdf = files.some((f) => f.name.endsWith('.pdf'));

    res.json({ project: meta, files, hasPdf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Read single file content
app.get('/api/projects/:id/files/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    const filePath = path.join(PROJECTS_ROOT, id, filename);

    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'File không tồn tại' });
    }

    // Serve raw binary files (images, pdf, fonts, etc.)
    if (req.query.raw === 'true' || filename.match(/\.(png|jpe?g|gif|svg|webp|ico|pdf|otf|ttf)$/i)) {
      return res.sendFile(filePath);
    }

    // Check if doc is in memory
    const docName = `${id}__${filename}`;
    const doc = getYDoc(docName);
    const yText = doc.getText('monaco');

    if (yText.length > 0) {
      return res.json({ content: yText.toString(), filename });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Create or save single file content
app.post('/api/projects/:id/files/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    const { content = '' } = req.body;
    const projDir = path.join(PROJECTS_ROOT, id);
    const filePath = path.join(projDir, filename);

    await fs.ensureDir(projDir);
    await fs.writeFile(filePath, content, 'utf-8');

    // Update YDoc if present
    const docName = `${id}__${filename}`;
    const doc = getYDoc(docName);
    const yText = doc.getText('monaco');
    if (yText.toString() !== content) {
      yText.delete(0, yText.length);
      yText.insert(0, content);
    }

    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete a file
app.delete('/api/projects/:id/files/:filename', async (req, res) => {
  try {
    const { id, filename } = req.params;
    if (filename === 'main.tex') {
      return res.status(400).json({ error: 'Không thể xóa file chính main.tex' });
    }
    const filePath = path.join(PROJECTS_ROOT, id, filename);
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
    res.json({ success: true, filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Upload asset/image into project
app.post('/api/projects/:id/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được tải lên' });
    }
    res.json({
      success: true,
      filename: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Compile LaTeX Project
app.post('/api/projects/:id/compile', async (req, res) => {
  try {
    const { id } = req.params;
    const { mainFile = 'main.tex' } = req.body;
    const projDir = path.join(PROJECTS_ROOT, id);

    if (!(await fs.pathExists(projDir))) {
      return res.status(404).json({ error: 'Dự án không tồn tại' });
    }

    // Flush all active memory edits to disk before compilation
    flushProjectDocsToDisk(id);

    console.log(`[Compile API] Yêu cầu biên dịch dự án ${id} (file: ${mainFile})`);
    const result = await compileLatex(projDir, mainFile);

    // Update project meta updatedAt
    const metaPath = path.join(projDir, 'meta.json');
    if (await fs.pathExists(metaPath)) {
      try {
        const meta = await fs.readJson(metaPath);
        meta.updatedAt = new Date().toISOString();
        meta.lastCompileSuccess = result.success;
        await fs.writeJson(metaPath, meta, { spaces: 2 });
      } catch (e) {}
    }

    res.json({
      ...result,
      pdfUrl: result.success ? `/api/projects/${id}/pdf?t=${Date.now()}` : null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      log: err.message,
      errors: [{ message: err.message, line: null }]
    });
  }
});

// 9. Serve generated PDF
app.get('/api/projects/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { file = 'main.pdf' } = req.query;
    const pdfPath = path.join(PROJECTS_ROOT, id, file);

    if (!(await fs.pathExists(pdfPath))) {
      return res.status(404).send('File PDF chưa được biên dịch.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${file}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    const pdfBuffer = await fs.readFile(pdfPath);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 10. Download project as ZIP
app.get('/api/projects/:id/zip', async (req, res) => {
  try {
    const { id } = req.params;
    const projDir = path.join(PROJECTS_ROOT, id);

    if (!(await fs.pathExists(projDir))) {
      return res.status(404).send('Dự án không tồn tại');
    }

    flushProjectDocsToDisk(id);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    archive.directory(projDir, false);
    await archive.finalize();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 11. Project Chat API
app.get('/api/projects/:id/chat', (req, res) => {
  const { id } = req.params;
  const messages = projectChats.get(id) || [];
  res.json({ messages });
});

app.post('/api/projects/:id/chat', (req, res) => {
  const { id } = req.params;
  const { sender = 'Ẩn danh', text = '', color = '#3b82f6' } = req.body;

  if (!text.trim()) {
    return res.status(400).json({ error: 'Nội dung tin nhắn không được rỗng' });
  }

  if (!projectChats.has(id)) {
    projectChats.set(id, []);
  }

  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender,
    text: text.trim(),
    color,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  };

  const list = projectChats.get(id);
  list.push(msg);
  if (list.length > 100) list.shift();

  res.json({ success: true, message: msg });
});

// 12. Auth & Mail Config API
app.get('/api/config/auth', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID || null,
    smtpConfigured: isSmtpConfigured()
  });
});

// 13. Invite member to project via Gmail
app.post('/api/projects/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, inviterName, inviterEmail, role = 'editor' } = req.body;
    const projDir = path.join(PROJECTS_ROOT, id);

    if (!(await fs.pathExists(projDir))) {
      return res.status(404).json({ error: 'Dự án không tồn tại' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Địa chỉ email không hợp lệ' });
    }

    const metaPath = path.join(projDir, 'meta.json');
    let meta = { id, title: id, collaborators: [] };
    if (await fs.pathExists(metaPath)) {
      meta = await fs.readJson(metaPath);
    }
    if (!meta.collaborators) meta.collaborators = [];

    // Add or update collaborator
    const existingIndex = meta.collaborators.findIndex((c) => c.email?.toLowerCase() === email.toLowerCase());
    const memberObj = {
      email: email.toLowerCase().trim(),
      role,
      invitedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      meta.collaborators[existingIndex] = { ...meta.collaborators[existingIndex], ...memberObj };
    } else {
      meta.collaborators.push(memberObj);
    }

    await fs.writeJson(metaPath, meta, { spaces: 2 });

    const host = req.get('host');
    const protocol = req.protocol;
    const inviteLink = `${protocol}://${host}/?project=${id}&user=${encodeURIComponent(email.split('@')[0])}`;

    // Attempt to send email via SMTP if configured
    const mailResult = await sendProjectInvitation({
      toEmail: email,
      inviterName,
      inviterEmail,
      projectTitle: meta.title || id,
      inviteLink
    });

    res.json({
      success: true,
      emailSent: mailResult.sent,
      reason: mailResult.reason || mailResult.error || null,
      inviteLink,
      collaborators: meta.collaborators
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Get project collaborators
app.get('/api/projects/:id/collaborators', async (req, res) => {
  try {
    const { id } = req.params;
    const metaPath = path.join(PROJECTS_ROOT, id, 'meta.json');
    if (!(await fs.pathExists(metaPath))) {
      return res.status(404).json({ error: 'Dự án không tồn tại' });
    }
    const meta = await fs.readJson(metaPath);
    res.json({
      collaborators: meta.collaborators || [],
      owner: meta.owner || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Remove collaborator
app.delete('/api/projects/:id/collaborators/:email', async (req, res) => {
  try {
    const { id, email } = req.params;
    const metaPath = path.join(PROJECTS_ROOT, id, 'meta.json');
    if (!(await fs.pathExists(metaPath))) {
      return res.status(404).json({ error: 'Dự án không tồn tại' });
    }
    const meta = await fs.readJson(metaPath);
    if (meta.collaborators) {
      meta.collaborators = meta.collaborators.filter((c) => c.email.toLowerCase() !== email.toLowerCase());
      await fs.writeJson(metaPath, meta, { spaces: 2 });
    }
    res.json({ success: true, collaborators: meta.collaborators || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 16. Serve Static Client Build in Production / Standalone mode
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log(`[Static Web] Đã kích hoạt phục vụ giao diện từ: ${clientDist}`);
}


// ==========================================
// HTTP & WEBSOCKET SERVER INITIALIZATION
// ==========================================

const server = http.createServer(app);

// WebSocket Server for Yjs collaboration
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const pathname = url.pathname;

  // Handle Yjs collaborative editing ws connections
  if (pathname.startsWith('/ws') || pathname.startsWith('/yjs')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      // Extract document room name: e.g. /ws/proj-123__main.tex or /ws?room=proj-123__main.tex
      let docName = url.searchParams.get('room');
      if (!docName) {
        docName = pathname.replace(/^\/(ws|yjs)\/?/, '');
      }

      if (!docName) {
        docName = 'default-latex-room';
      }

      // Parse projectId and filename from docName
      const parts = docName.split('__');
      if (parts.length >= 2) {
        const [projectId, fileName] = parts;
        ensureDocLoadedAndSynced(projectId, fileName);
      }

      console.log(`[WebSocket Connect] Client kết nối vào phòng Yjs: ${docName}`);
      setupWSConnection(ws, request, { docName });
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 LaTeX Collaborative Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 WebSocket Yjs endpoint: ws://localhost:${PORT}/ws/:roomName`);
  console.log(`📂 Projects folder: ${PROJECTS_ROOT}`);
  console.log(`=======================================================`);
});
