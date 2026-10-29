export const DEFAULT_MAIN_TEX = `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb,amsfonts,amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\usepackage{booktabs}
\\usepackage{xcolor}

\\geometry{margin=1in}

\\theoremstyle{definition}
\\newtheorem{definition}{Định nghĩa}[section]
\\newtheorem{theorem}{Định lý}[section]

\\title{\\textbf{Hệ Thống Soạn Thảo \\LaTeX\\ Trực Tuyến Đa Người Dùng}\\\\
\\large Báo Cáo Nghiên Cứu và Thiết Kế Hệ Thống Thời Gian Thực}

\\author{
  Tác giả chính \\and Cộng tác viên 1 \\and Cộng tác viên 2
}

\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Tài liệu này giới thiệu kiến trúc và giải pháp kỹ thuật xây dựng nền tảng soạn thảo \\LaTeX\\ cộng tác thời gian thực (Collaborative Real-time Editor) cho phép từ 6 người dùng trở lên cùng tương tác, chỉnh sửa đồng thời mà không bị xung đột, đồng thời hỗ trợ biên dịch và hiển thị kết quả PDF trực tiếp trên trình duyệt.
\\end{abstract}

\\section{Giới thiệu chung}
Trong thời đại chuyển đổi số, việc làm việc nhóm trên các tài liệu khoa học đòi hỏi tính tức thời cao. 
Mô hình toán học CRDT (Conflict-free Replicated Data Type) kết hợp cùng động cơ biên dịch Tectonic cho phép người dùng có trải nghiệm tương tự như Overleaf, nhưng với tốc độ xử lý nhanh chóng và tối ưu tài nguyên.

\\section{Các công thức toán học mẫu}
Hệ thống hỗ trợ đầy đủ các môi trường toán học của \\texttt{amsmath}.

Công thức năng lượng nổi tiếng của Einstein:
\\begin{equation}
E = mc^2
\\end{equation}

Tích phân Gauss nhiều chiều:
\\begin{equation}
\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
\\end{equation}

Ma trận chuyển vị xác suất $P$:
\\begin{equation}
P = \\begin{pmatrix}
p_{11} & p_{12} & \\cdots & p_{1n} \\\\
p_{21} & p_{22} & \\cdots & p_{2n} \\\\
\\vdots & \\vdots & \\ddots & \\vdots \\\\
p_{n1} & p_{n2} & \\cdots & p_{nn}
\\end{pmatrix}
\\end{equation}

\\section{Định lý và Chứng minh}
\\begin{definition}[Cộng tác CRDT]
Một hệ thống CRDT đảm bảo rằng bất kể thứ tự các thao tác thêm/xóa ký tự từ $N$ người dùng ($N \\ge 6$), trạng thái tài liệu cuối cùng tại mọi nút đều hội tụ về một chuỗi văn bản giống hệt nhau.
\\end{definition}

\\begin{theorem}[Hội tụ văn bản]
Mọi cập nhật văn bản từ các thành viên trong phòng soạn thảo đều đồng bộ tức thì qua WebSocket với độ trễ dưới 50ms trong điều kiện mạng tiêu chuẩn.
\\end{theorem}

\\section{Bảng dữ liệu mẫu}
\\begin{table}[h]
\\centering
\\begin{tabular}{@{}lcr@{}}
\\toprule
\\textbf{Thành phần} & \\textbf{Công nghệ} & \\textbf{Hiệu năng} \\\\
\\midrule
Editor Core & Monaco Editor & 60 FPS \\\\
CRDT Engine & Yjs WebSocket & $< 20$ms sync \\\\
Compiler & Tectonic Standalone & $< 0.8$s compile \\\\
PDF Viewer & PDF.js / Browser Preview & Zero latency \\\\
\\bottomrule
\\end{tabular}
\\caption{Bảng đánh giá hiệu năng các thành phần hệ thống}
\\end{table}

\\section{Kết luận}
Hệ sinh thái mã nguồn mở cho phép chúng ta làm chủ hoàn toàn hạ tầng soạn thảo khoa học, bảo mật dữ liệu nội bộ và tăng cường hiệu suất nghiên cứu khoa học theo nhóm.

\\end{document}
`;

export const BLANK_MAIN_TEX = `\\documentclass[12pt,a4paper]{article}
\\usepackage{fontspec}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{Tài Liệu Mới}
\\author{Tác giả}
\\date{\\today}

\\begin{document}
\\maketitle

\\section{Nội dung bắt đầu}
Hãy bắt đầu soạn thảo tài liệu LaTeX của bạn tại đây!

\\end{document}
`;

export const REPORT_MAIN_TEX = `\\documentclass[12pt,a4paper]{report}
\\usepackage{fontspec}
\\usepackage[vietnamese]{babel}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{hyperref}
\\geometry{top=2.5cm,bottom=2.5cm,left=3cm,right=2cm}

\\title{\\textbf{BÁO CÁO KỸ THUẬT VÀ ĐỒ ÁN}\\\\
\\large Chuyên ngành Khoa học Máy tính}
\\author{Nhóm Thực Hiện}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

\\chapter{Tổng Quan Đề Tài}
\\section{Đặt vấn đề}
Nội dung phân tích thực trạng và mục tiêu nghiên cứu.

\\section{Phạm vi dự án}
Giới hạn và đối tượng nghiên cứu của báo cáo.

\\chapter{Giải Pháp Kỹ Thuật}
\\section{Kiến trúc hệ thống}
Mô tả các thành phần phần cứng và phần mềm.

\\chapter{Kết Quả và Đánh Giá}
Tổng kết các kết quả đạt được.

\\end{document}
`;

export const BEAMER_MAIN_TEX = `\\documentclass{beamer}
\\usepackage{fontspec}
\\usepackage[vietnamese]{babel}
\\usetheme{Madrid}

\\title{Thuyết Trình Đề Tài Khoa Học}
\\subtitle{Hệ thống Soạn thảo LaTeX Thời Gian Thực}
\\author{Nhóm Báo Cáo}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Nội Dung Trình Bày}
  \\tableofcontents
\\end{frame}

\\section{Giới Thiệu}
\\begin{frame}{1. Giới Thiệu Chung}
  \\begin{itemize}
    \\item Mục tiêu xây dựng nền tảng cộng tác trực tuyến.
    \\item Cho phép nhiều người cùng soạn thảo không bị xung đột.
    \\item Tích hợp biên dịch PDF tức thì.
  \\end{itemize}
\\end{frame}

\\section{Công Nghệ}
\\begin{frame}{2. Công Nghệ Cốt Lõi}
  \\begin{block}{Thuật toán CRDT Yjs}
    Đảm bảo tính hội tụ văn bản giữa mọi người dùng với độ trễ tối thiểu.
  \\end{block}
  \\begin{block}{Động cơ Tectonic}
    Biên dịch tài liệu độc lập với tốc độ cao.
  \\end{block}
\\end{frame}

\\section{Kết Luận}
\\begin{frame}{3. Kết Luận}
  Cảm ơn thầy cô và các bạn đã lắng nghe!
\\end{frame}

\\end{document}
`;

export const DEFAULT_README = `# Dự Án LaTeX Cộng Tác
Chào mừng bạn đến với dự án!
- Mọi thành viên trong nhóm có thể mở link này trên trình duyệt khác nhau để cùng gõ.
- Vị trí con trỏ và tên của từng thành viên sẽ hiển thị màu riêng biệt.
- Bấm **"Biên dịch PDF"** (hoặc Ctrl+S / F5) để cập nhật file PDF mới nhất.
`;
