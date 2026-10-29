import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading, 
  Heading1, 
  Heading2, 
  Pi, 
  Sigma, 
  Binary, 
  Table as TableIcon, 
  Image as ImageIcon, 
  List, 
  ListOrdered, 
  Quote, 
  ChevronDown, 
  Code, 
  BookOpen, 
  Bookmark, 
  Tag, 
  Layers,
  Sparkles,
  FileText
} from 'lucide-react';

export default function Toolbar({ onInsert }) {
  const [openMenu, setOpenMenu] = useState(null);
  const toolbarRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectSnippet = (snippet) => {
    onInsert(snippet);
    setOpenMenu(null);
  };

  const toggleMenu = (name) => {
    setOpenMenu(openMenu === name ? null : name);
  };

  // Grouped Menu Configurations
  const dropdownGroups = [
    {
      id: 'headings',
      label: 'Headings',
      icon: <Heading className="w-3.5 h-3.5 text-indigo-400" />,
      items: [
        {
          label: 'Section',
          code: '\\section{Section Title}\n',
          desc: 'Numbered major document section'
        },
        {
          label: 'Subsection',
          code: '\\subsection{Subsection Title}\n',
          desc: 'Secondary subsection (e.g. 1.1)'
        },
        {
          label: 'Subsubsection',
          code: '\\subsubsection{Subsubsection Title}\n',
          desc: 'Minor subsubsection (e.g. 1.1.1)'
        },
        {
          label: 'Paragraph',
          code: '\\paragraph{Paragraph Title}\n',
          desc: 'Inline bold paragraph heading'
        },
        {
          label: 'Table of Contents',
          code: '\\tableofcontents\n\\newpage\n',
          desc: 'Auto-generated table of contents'
        },
        {
          label: 'New Page',
          code: '\\newpage\n',
          desc: 'Page break to next page'
        }
      ]
    },
    {
      id: 'math',
      label: 'Math',
      icon: <Sigma className="w-3.5 h-3.5 text-indigo-400" />,
      items: [
        {
          label: 'Inline Math',
          code: '$f(x) = y$',
          desc: 'Math expression embedded in text'
        },
        {
          label: 'Numbered Equation',
          code: '\\begin{equation}\n  E = mc^2\n  \\label{eq:emc2}\n\\end{equation}\n',
          desc: 'Centered equation with numbering'
        },
        {
          label: 'Aligned Equations (align)',
          code: '\\begin{align}\n  2x + y &= 7 \\\\\n  x - y &= 2\n\\end{align}\n',
          desc: 'Multi-line equations aligned by &'
        },
        {
          label: 'Fraction (frac)',
          code: '\\frac{a}{b}',
          desc: 'Fraction expression (a over b)'
        },
        {
          label: 'Square Root (sqrt)',
          code: '\\sqrt{x}',
          desc: 'Square root radical symbol'
        },
        {
          label: 'N-th Root (sqrt[n])',
          code: '\\sqrt[n]{x}',
          desc: 'Custom degree n-th root'
        },
        {
          label: 'Summation (sum)',
          code: '\\sum_{i=1}^{n} x_i',
          desc: 'Summation symbol from i=1 to n'
        },
        {
          label: 'Definite Integral (int)',
          code: '\\int_{a}^{b} f(x) \\, dx',
          desc: 'Integral from lower bound a to b'
        },
        {
          label: 'Limit (lim)',
          code: '\\lim_{x \\to \\infty} f(x)',
          desc: 'Limit as x approaches infinity'
        },
        {
          label: 'Partial Derivative',
          code: '\\frac{\\partial f}{\\partial x}',
          desc: 'Partial derivative of f with respect to x'
        }
      ]
    },
    {
      id: 'matrix',
      label: 'Matrices',
      icon: <Binary className="w-3.5 h-3.5 text-indigo-400" />,
      items: [
        {
          label: 'Parentheses Matrix (pmatrix)',
          code: '\\begin{pmatrix}\n  a & b \\\\\n  c & d\n\\end{pmatrix}\n',
          desc: 'Matrix with round parentheses ( )'
        },
        {
          label: 'Brackets Matrix (bmatrix)',
          code: '\\begin{bmatrix}\n  1 & 0 & 0 \\\\\n  0 & 1 & 0 \\\\\n  0 & 0 & 1\n\\end{bmatrix}\n',
          desc: 'Matrix with square brackets [ ]'
        },
        {
          label: 'Determinant (vmatrix)',
          code: '\\begin{vmatrix}\n  a & b \\\\\n  c & d\n\\end{vmatrix}\n',
          desc: 'Determinant with vertical bars | |'
        },
        {
          label: 'Piecewise / Cases',
          code: 'f(x) = \\begin{cases}\n  x^2 & \\text{if } x \\ge 0 \\\\\n  -x & \\text{if } x < 0\n\\end{cases}\n',
          desc: 'Conditional multi-case system {'
        },
        {
          label: 'Vector',
          code: '\\vec{v} = (v_1, v_2, v_3)',
          desc: 'Vector notation with arrow accent'
        }
      ]
    },
    {
      id: 'tables_figures',
      label: 'Tables & Figures',
      icon: <TableIcon className="w-3.5 h-3.5 text-emerald-400" />,
      items: [
        {
          label: 'Standard Table',
          code: '\\begin{table}[h]\n\\centering\n\\begin{tabular}{|c|c|c|}\n\\hline\nNo. & Metric & Result \\\\\n\\hline\n1 & Accuracy & 98.5\\% \\\\\n2 & Latency & 12ms \\\\\n\\hline\n\\end{tabular}\n\\caption{Experimental Results}\n\\label{tab:results}\n\\end{table}\n',
          desc: 'Data table with grid borders and caption'
        },
        {
          label: 'Professional Booktabs Table',
          code: '\\begin{table}[h]\n\\centering\n\\begin{tabular}{llr}\n\\toprule\nItem ID & Metric Name & Score \\\\\n\\midrule\nA01 & LaTeX Parsing & 9.8 \\\\\nA02 & PDF Compile & 10.0 \\\\\n\\bottomrule\n\\end{tabular}\n\\caption{Publication Quality Table}\n\\label{tab:booktabs}\n\\end{table}\n',
          desc: 'Publication-grade table without vertical rules'
        },
        {
          label: 'Figure (Image)',
          code: '\\begin{figure}[h]\n\\centering\n% \\includegraphics[width=0.75\\textwidth]{image.png}\n\\caption{Research Graphic Overview}\n\\label{fig:sample}\n\\end{figure}\n',
          desc: 'Centered graphic with caption and label'
        },
        {
          label: 'Side-by-Side Subfigures',
          code: '\\begin{figure}[h]\n\\centering\n\\begin{minipage}{0.45\\textwidth}\n  \\centering\n  % \\includegraphics[width=\\linewidth]{fig1.png}\n  \\caption{Figure A}\n\\end{minipage}\\hfill\n\\begin{minipage}{0.45\\textwidth}\n  \\centering\n  % \\includegraphics[width=\\linewidth]{fig2.png}\n  \\caption{Figure B}\n\\end{minipage}\n\\caption{Comparative Results}\n\\end{figure}\n',
          desc: 'Two graphics side-by-side using minipages'
        }
      ]
    },
    {
      id: 'lists_envs',
      label: 'Lists & Blocks',
      icon: <List className="w-3.5 h-3.5 text-cyan-400" />,
      items: [
        {
          label: 'Bullet List (itemize)',
          code: '\\begin{itemize}\n  \\item First item\n  \\item Second item\n  \\item Third item\n\\end{itemize}\n',
          desc: 'Unordered bulleted list'
        },
        {
          label: 'Numbered List (enumerate)',
          code: '\\begin{enumerate}\n  \\item Step 1: Initialize\n  \\item Step 2: Execute\n  \\item Step 3: Evaluate\n\\end{enumerate}\n',
          desc: 'Ordered numbered list (1, 2, 3...)'
        },
        {
          label: 'Description List',
          code: '\\begin{description}\n  \\item[Concept A] Definition of concept A.\n  \\item[Concept B] Definition of concept B.\n\\end{description}\n',
          desc: 'Term definition list with bold keywords'
        },
        {
          label: 'Block Quote',
          code: '\\begin{quote}\n  "Science knows no country, because knowledge belongs to humanity."\n\\end{quote}\n',
          desc: 'Indented quotation block'
        },
        {
          label: 'Verbatim Code Block',
          code: '\\begin{verbatim}\n# Code sample\ndef hello_world():\n    print("LaTeX Collaborative")\n\\end{verbatim}\n',
          desc: 'Preformatted monospace code block'
        }
      ]
    },
    {
      id: 'theorems_refs',
      label: 'Theorems & Citations',
      icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" />,
      items: [
        {
          label: 'Theorem',
          code: '\\begin{theorem}\n  Let $a$ and $b$ be legs of a right triangle, then $c^2 = a^2 + b^2$.\n\\end{theorem}\n',
          desc: 'Formal mathematical theorem environment'
        },
        {
          label: 'Definition',
          code: '\\begin{definition}\n  A vector space $V$ over field $K$ is defined as...\n\\end{definition}\n',
          desc: 'Concept definition block'
        },
        {
          label: 'Proof',
          code: '\\begin{proof}\n  Indeed, we have...\n  This completes the proof.\n\\end{proof}\n',
          desc: 'Proof argument ending with Q.E.D.'
        },
        {
          label: 'Citation (\\cite)',
          code: '\\cite{author2026}',
          desc: 'Bibliographic citation key reference'
        },
        {
          label: 'Cross-Reference (\\ref)',
          code: '\\ref{fig:sample}',
          desc: 'Reference to figure, table, or equation'
        },
        {
          label: 'Label Anchor (\\label)',
          code: '\\label{sec:intro}',
          desc: 'Identifier tag for cross-referencing'
        }
      ]
    }
  ];

  return (
    <div 
      ref={toolbarRef}
      className="h-9 bg-gray-900 border-b border-gray-800 px-2.5 flex items-center space-x-1 select-none relative z-30 overflow-x-visible text-xs"
    >
      {/* Quick Buttons for Direct Formatting */}
      <div className="flex items-center space-x-0.5 shrink-0">
        <button
          onClick={() => onInsert('\\textbf{bold text}')}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition flex items-center justify-center font-bold"
          title="Bold (\textbf)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onInsert('\\textit{italic text}')}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition flex items-center justify-center italic"
          title="Italic (\textit)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onInsert('\\underline{underlined text}')}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition flex items-center justify-center underline"
          title="Underline (\underline)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onInsert('$E = mc^2$')}
          className="p-1.5 rounded hover:bg-gray-800 text-indigo-400 hover:text-indigo-300 transition flex items-center justify-center"
          title="Inline Math ($ ... $)"
        >
          <Pi className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onInsert('\\begin{equation}\n  \\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}\n\\end{equation}\n')}
          className="p-1.5 rounded hover:bg-gray-800 text-indigo-400 hover:text-indigo-300 transition flex items-center justify-center"
          title="Numbered Equation (\begin{equation})"
        >
          <Sigma className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vertical divider */}
      <div className="h-4 w-[1px] bg-gray-800 mx-1 shrink-0" />

      {/* Compact Dropdown Tool Menus (Icon-only with chevron to save space) */}
      <div className="flex items-center space-x-1 shrink-0">
        {dropdownGroups.map((group) => {
          const isOpen = openMenu === group.id;
          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => toggleMenu(group.id)}
                className={`flex items-center space-x-1 px-1.5 py-1 rounded-md transition border ${
                  isOpen
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-gray-800/60 hover:bg-gray-800 border-gray-700/60 text-gray-300 hover:text-white'
                }`}
                title={group.label}
              >
                {group.icon}
                <ChevronDown className={`w-2.5 h-2.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Dropdown Menu Popup */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-72 bg-gray-900/95 backdrop-blur-md border border-gray-700/90 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-gray-800/60">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{group.label}</span>
                    <span className="text-indigo-400 font-mono">LaTeX</span>
                  </div>

                  <div className="py-1 max-h-80 overflow-y-auto space-y-0.5">
                    {group.items.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSnippet(item.code)}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-gray-800/90 text-gray-200 hover:text-white transition group flex flex-col space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-200 group-hover:text-indigo-300 transition">
                            {item.label}
                          </span>
                        </div>
                        {item.desc && (
                          <span className="text-[10px] text-gray-400 leading-tight">
                            {item.desc}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
