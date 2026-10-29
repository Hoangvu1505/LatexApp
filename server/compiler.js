import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for platform-specific tectonic binary, fallback to system command
const bundledTectonicWin = path.resolve(__dirname, '../bin/tectonic.exe');
const bundledTectonicLinux = path.resolve(__dirname, '../bin/tectonic');
let TECTONIC_BIN = 'tectonic';

if (process.platform === 'win32' && fs.existsSync(bundledTectonicWin)) {
  TECTONIC_BIN = bundledTectonicWin;
} else if (process.platform !== 'win32' && fs.existsSync(bundledTectonicLinux)) {
  TECTONIC_BIN = bundledTectonicLinux;
}

// Active compilation locks per project to prevent race condition file lock crashes
const activeCompiles = new Map();

/**
 * Intelligent error and warning parser for Tectonic / XeLaTeX logs
 */
function parseLatexErrors(rawLog) {
  const errors = [];
  const lines = rawLog.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignore harmless Windows fontconfig notice and exit notices
    if (
      line.includes('Fontconfig error') ||
      line.includes('halted on potentially-recoverable error') ||
      line.includes('Emergency stop')
    ) {
      continue;
    }

    // Pattern 1: Tectonic format: "error: file.tex:12: Error message"
    const tectonicMatch = line.match(/^error:\s+([^:]+):(\d+):\s+(.*)$/i);
    if (tectonicMatch) {
      const [, file, lineNum, message] = tectonicMatch;
      const parsedLine = parseInt(lineNum, 10);
      const cleanMsg = message.trim();
      const norm = (s) => (s || '').toLowerCase().replace(/[.\s]+$/, '').trim();
      const isDuplicate = errors.some((e) => e.line === parsedLine && norm(e.message) === norm(cleanMsg));
      if (!isDuplicate) {
        errors.push({
          file: path.basename(file),
          line: parsedLine,
          message: cleanMsg,
          snippet: ''
        });
      }
      continue;
    }

    // Pattern 2: Standard LaTeX format: "! LaTeX Error: ..." or "! Undefined control sequence."
    if (line.startsWith('!')) {
      const message = line.replace(/^!\s*/, '').trim();
      let lineNum = null;
      let snippet = '';

      // Look ahead for "l.123 <snippet>" in the next few lines
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const nextLine = lines[j].trim();
        const lMatch = nextLine.match(/^l\.(\d+)\s*(.*)$/);
        if (lMatch) {
          lineNum = parseInt(lMatch[1], 10);
          snippet = lMatch[2].trim();
          break;
        }
      }

      const norm = (s) => (s || '').toLowerCase().replace(/[.\s]+$/, '').trim();
      const existing = errors.find((e) => e.line === lineNum && norm(e.message) === norm(message));

      if (existing) {
        if (!existing.snippet && snippet) existing.snippet = snippet;
      } else {
        errors.push({
          line: lineNum,
          message,
          snippet
        });
      }
    }
  }

  return errors;
}

/**
 * Clean up potentially corrupted auxiliary files (.aux, .toc, .out)
 */
function cleanAuxiliaryFiles(projectDir, baseName) {
  const extensions = ['.aux', '.toc', '.out', '.xdv', '.log', '.nav', '.snm', '.vrb'];
  for (const ext of extensions) {
    const p = path.join(projectDir, `${baseName}${ext}`);
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
      } catch (e) {}
    }
  }
}

/**
 * Auto-adapt legacy LaTeX packages for XeTeX / Tectonic Unicode engine
 */
export function sanitizeLatexSource(rawContent) {
  let content = rawContent.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM
  let changed = false;

  // 1. Fix legacy pdfLaTeX T5 fontenc (which drops Vietnamese Unicode characters in XeTeX)
  if (/\\usepackage(\[[^\]]*T5[^\]]*\])?\{fontenc\}/i.test(content)) {
    content = content.replace(
      /\\usepackage(\[[^\]]*T5[^\]]*\])?\{fontenc\}/gi,
      '\\usepackage{fontspec} % [Tự động chuyển từ T5 fontenc sang fontspec để hiển thị tiếng Việt trên Tectonic]'
    );
    // Comment out \usepackage[utf8]{inputenc}
    content = content.replace(
      /\\usepackage\[utf8\]\{inputenc\}/gi,
      '% \\usepackage[utf8]{inputenc} % [Không cần thiết cho bộ biên dịch XeTeX/Tectonic]'
    );
    changed = true;
  }

  // 2. Ensure fontspec is present if document uses vietnamese babel without fontspec
  if (
    content.includes('\\usepackage[vietnamese]{babel}') &&
    !content.includes('\\usepackage{fontspec}') &&
    !content.includes('\\usepackage[T5]{fontenc}')
  ) {
    content = content.replace(
      '\\usepackage[vietnamese]{babel}',
      '\\usepackage{fontspec}\n\\usepackage[vietnamese]{babel}'
    );
    changed = true;
  }

  return { content, changed };
}

/**
 * Internal compilation execution
 */
async function runTectonicProcess(projectDir, fullMainPath, baseName, expectedPdf) {
  const startTime = Date.now();
  const args = ['--print', '--outdir', projectDir, fullMainPath];

  console.log(`[Compiler] Thực thi: ${TECTONIC_BIN} ${args.join(' ')}`);

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';

    const proc = spawn(TECTONIC_BIN, args, {
      cwd: projectDir,
      windowsHide: true,
      env: process.env
    });

    proc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    // 45 seconds timeout safety
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        success: false,
        exitCode: -1,
        log: stdoutData + '\n' + stderrData + '\n[Quá thời gian] Quá trình biên dịch vượt quá 45 giây.',
        errors: [{ message: 'Biên dịch quá thời gian quy định (Timeout)', line: null }],
        duration: Date.now() - startTime
      });
    }, 45000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      const combinedLog = (stdoutData + '\n' + stderrData).trim();
      const pdfExists = fs.existsSync(expectedPdf);
      const success = code === 0 && pdfExists;
      const parsedErrors = success ? [] : parseLatexErrors(combinedLog);

      resolve({
        success,
        exitCode: code,
        duration,
        log: combinedLog,
        errors: parsedErrors,
        pdfName: `${baseName}.pdf`
      });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        exitCode: -1,
        log: `Lỗi khởi chạy bộ biên dịch (${TECTONIC_BIN}): ${err.message}`,
        errors: [{ message: `Lỗi khởi chạy engine: ${err.message}`, line: null }],
        duration: Date.now() - startTime
      });
    });
  });
}

/**
 * Compile a LaTeX project with locking and auto-recovery
 */
export async function compileLatex(projectDir, mainFile = 'main.tex') {
  // If a compilation is already running for this project, wait for it
  if (activeCompiles.has(projectDir)) {
    console.log(`[Compiler] Dự án ${projectDir} đang được biên dịch, xếp hàng chờ...`);
    try {
      return await activeCompiles.get(projectDir);
    } catch (e) {}
  }

  const compilePromise = (async () => {
    const fullMainPath = path.join(projectDir, mainFile);

    if (!fs.existsSync(fullMainPath)) {
      return {
        success: false,
        log: `File không tồn tại: ${mainFile}`,
        errors: [{ message: `File không tồn tại: ${mainFile}`, line: 1 }],
        duration: 0
      };
    }

    const baseName = path.parse(mainFile).name;
    const expectedPdf = path.join(projectDir, `${baseName}.pdf`);

    // 1. Sanitize file for XeTeX / Tectonic Unicode compatibility
    try {
      const original = fs.readFileSync(fullMainPath, 'utf-8');
      const { content: sanitized, changed } = sanitizeLatexSource(original);
      if (changed) {
        fs.writeFileSync(fullMainPath, sanitized, 'utf-8');
        console.log(`[Compiler] Đã tự động chuẩn hóa font/Unicode cho file ${mainFile}`);
      }
    } catch (e) {
      console.error('[Compiler Sanitize Error]', e);
    }

    // 2. First compilation attempt
    let result = await runTectonicProcess(projectDir, fullMainPath, baseName, expectedPdf);

    // 3. Auto-recovery: If failed due to corrupted .aux or .toc file, clean and retry once
    if (
      !result.success &&
      (result.log.includes('File ended while scanning') ||
        result.log.includes('Argument of') ||
        result.log.includes('Runaway argument') ||
        result.log.includes('.aux') ||
        result.log.includes('.toc'))
    ) {
      console.warn(`[Compiler Auto-Recovery] Phát hiện file aux/toc có thể bị lỗi, đang dọn dẹp và thử lại...`);
      cleanAuxiliaryFiles(projectDir, baseName);
      result = await runTectonicProcess(projectDir, fullMainPath, baseName, expectedPdf);
    }

    return result;
  })();

  activeCompiles.set(projectDir, compilePromise);

  try {
    const finalResult = await compilePromise;
    return finalResult;
  } finally {
    activeCompiles.delete(projectDir);
  }
}
