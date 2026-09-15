"""
Convert MEMORIAL_DE_CALCULO.md → MEMORIAL_DE_CALCULO.docx using python-docx.
Run from the docs/ directory:  python build_memorial.py
"""

import re
from docx import Document
from docx.shared import Pt, RGBColor, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


# ── Colour palette ────────────────────────────────────────────────────────────
TEAL       = RGBColor(0x00, 0x7A, 0x7A)   # headings / accents
DARK_GRAY  = RGBColor(0x1A, 0x1A, 0x2E)   # body text
MID_GRAY   = RGBColor(0x55, 0x55, 0x55)   # secondary text
CODE_BG    = RGBColor(0xF3, 0xF4, 0xF6)   # light gray — code / formula shading
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
HEAD_BG    = RGBColor(0x00, 0x7A, 0x7A)   # table header bg
ROW_ALT    = RGBColor(0xF0, 0xFA, 0xFA)   # alternating row tint


def set_cell_bg(cell, rgb: RGBColor):
    """Apply a solid background colour to a table cell."""
    tc   = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd  = OxmlElement('w:shd')
    hex_color = f"{rgb[0]:02X}{rgb[1]:02X}{rgb[2]:02X}"
    shd.set(qn('w:val'),   'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'),  hex_color)
    tcPr.append(shd)


def add_horizontal_rule(doc):
    """Add a thin teal horizontal line."""
    p    = doc.add_paragraph()
    pPr  = p._p.get_or_add_pPr()
    pBdr = OxmlElement('w:pBdr')
    bot  = OxmlElement('w:bottom')
    bot.set(qn('w:val'),   'single')
    bot.set(qn('w:sz'),    '6')
    bot.set(qn('w:space'), '1')
    bot.set(qn('w:color'), '007A7A')
    pBdr.append(bot)
    pPr.append(pBdr)
    p.paragraph_format.space_after = Pt(0)


def render_inline(para, text: str, base_color: RGBColor = DARK_GRAY, base_size: int = 10):
    """
    Parse inline markdown and add runs to `para`:
      - **bold**
      - `code`
      - plain text
    LaTeX math ($...$) is rendered as italic code-style.
    """
    # Combined pattern: bold, inline-code, latex-math
    pattern = r'(\*\*(.+?)\*\*|`([^`]+)`|\$([^$]+)\$)'
    parts = re.split(pattern, text)
    i = 0
    while i < len(parts):
        chunk = parts[i]
        if not chunk:
            i += 1
            continue
        # Bold: **...**
        if chunk.startswith('**') and chunk.endswith('**'):
            run = para.add_run(parts[i + 2])
            run.bold = True
            run.font.color.rgb = base_color
            run.font.size = Pt(base_size)
            i += 5
        # Inline code: `...`
        elif chunk.startswith('`') and chunk.endswith('`'):
            run = para.add_run(parts[i + 3] if i + 3 < len(parts) and parts[i + 3] else chunk[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(base_size - 0.5)
            run.font.color.rgb = RGBColor(0xC7, 0x25, 0x4F)
            i += 5
        # LaTeX math: $...$
        elif chunk.startswith('$') and chunk.endswith('$'):
            run = para.add_run(parts[i + 4] if i + 4 < len(parts) and parts[i + 4] else chunk[1:-1])
            run.italic = True
            run.font.name = 'Cambria Math'
            run.font.size = Pt(base_size)
            run.font.color.rgb = RGBColor(0x1A, 0x52, 0x76)
            i += 5
        else:
            run = para.add_run(chunk)
            run.font.color.rgb = base_color
            run.font.size = Pt(base_size)
            i += 1


# ── Main builder ──────────────────────────────────────────────────────────────

def build_docx(md_path: str, out_path: str):
    with open(md_path, encoding='utf-8') as f:
        lines = f.readlines()

    doc = Document()

    # ── Page margins ──────────────────────────────────────────────────────────
    for section in doc.sections:
        section.top_margin    = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin   = Cm(2.5)
        section.right_margin  = Cm(2.5)

    # ── Default body font ─────────────────────────────────────────────────────
    doc.styles['Normal'].font.name  = 'Calibri'
    doc.styles['Normal'].font.size  = Pt(10)
    doc.styles['Normal'].font.color.rgb = DARK_GRAY

    i = 0
    in_code_block   = False
    code_lines: list[str] = []
    in_table        = False
    table_rows: list[list[str]] = []
    is_header_row   = True

    def flush_code():
        nonlocal code_lines
        if not code_lines:
            return
        tbl = doc.add_table(rows=1, cols=1)
        tbl.style = 'Table Grid'
        cell = tbl.rows[0].cells[0]
        set_cell_bg(cell, CODE_BG)
        cell.paragraphs[0].clear()
        for j, cl in enumerate(code_lines):
            if j == 0:
                p = cell.paragraphs[0]
            else:
                p = cell.add_paragraph()
            run = p.add_run(cl.rstrip())
            run.font.name  = 'Consolas'
            run.font.size  = Pt(9)
            run.font.color.rgb = RGBColor(0x1E, 0x1E, 0x2E)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after  = Pt(0)
        doc.add_paragraph()
        code_lines = []

    def flush_table():
        nonlocal table_rows, is_header_row
        if not table_rows:
            return
        # Filter out separator rows (---|---|...)
        real_rows = [r for r in table_rows if not all(re.match(r'^[-: ]+$', c) for c in r)]
        if not real_rows:
            table_rows = []
            is_header_row = True
            return

        num_cols = max(len(r) for r in real_rows)
        tbl = doc.add_table(rows=len(real_rows), cols=num_cols)
        tbl.style = 'Table Grid'

        for ri, row_cells in enumerate(real_rows):
            for ci in range(num_cols):
                cell_text = row_cells[ci].strip() if ci < len(row_cells) else ''
                cell = tbl.rows[ri].cells[ci]
                cell.paragraphs[0].clear()
                p = cell.paragraphs[0]

                if ri == 0:
                    # Header row
                    set_cell_bg(cell, HEAD_BG)
                    run = p.add_run(cell_text)
                    run.bold = True
                    run.font.color.rgb = WHITE
                    run.font.size = Pt(9)
                else:
                    if ri % 2 == 0:
                        set_cell_bg(cell, ROW_ALT)
                    render_inline(p, cell_text, base_size=9)

                p.paragraph_format.space_before = Pt(1)
                p.paragraph_format.space_after  = Pt(1)

        doc.add_paragraph()
        table_rows = []
        is_header_row = True

    while i < len(lines):
        raw = lines[i].rstrip('\n')
        i += 1

        # ── Code fence ──────────────────────────────────────────────────────
        if raw.startswith('```'):
            if in_code_block:
                flush_code()
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(raw)
            continue

        # ── Table rows ──────────────────────────────────────────────────────
        if raw.strip().startswith('|'):
            cells = [c.strip() for c in raw.strip().strip('|').split('|')]
            table_rows.append(cells)
            in_table = True
            continue
        else:
            if in_table:
                flush_table()
                in_table = False

        # ── Empty line ──────────────────────────────────────────────────────
        if raw.strip() == '':
            continue

        # ── Horizontal rule ----- ────────────────────────────────────────────
        if re.match(r'^-{3,}$', raw.strip()):
            add_horizontal_rule(doc)
            continue

        # ── Headings ─────────────────────────────────────────────────────────
        m = re.match(r'^(#{1,4})\s+(.*)', raw)
        if m:
            level = len(m.group(1))
            text  = m.group(2)

            if level == 1:
                # Document title — big teal
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after  = Pt(6)
                run = p.add_run(text)
                run.font.name  = 'Calibri Light'
                run.font.size  = Pt(24)
                run.font.color.rgb = TEAL
                run.bold = True
                add_horizontal_rule(doc)

            elif level == 2:
                # Section heading
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(16)
                p.paragraph_format.space_after  = Pt(4)
                run = p.add_run(text)
                run.font.name  = 'Calibri Light'
                run.font.size  = Pt(15)
                run.font.color.rgb = TEAL
                run.bold = True

            elif level == 3:
                # Sub-heading
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(10)
                p.paragraph_format.space_after  = Pt(2)
                run = p.add_run(text)
                run.font.name  = 'Calibri'
                run.font.size  = Pt(11)
                run.font.color.rgb = DARK_GRAY
                run.bold = True

            elif level == 4:
                p = doc.add_paragraph()
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after  = Pt(2)
                run = p.add_run(text)
                run.font.name  = 'Calibri'
                run.font.size  = Pt(10)
                run.font.color.rgb = MID_GRAY
                run.bold = True
                run.italic = True
            continue

        # ── Math block ($$...$$) ─────────────────────────────────────────────
        if raw.strip().startswith('$$'):
            formula = raw.strip()[2:].rstrip('$').strip()
            if not formula:
                # Multi-line $$ block — gather until closing $$
                math_lines = []
                while i < len(lines):
                    ml = lines[i].rstrip('\n')
                    i += 1
                    if ml.strip() == '$$':
                        break
                    math_lines.append(ml)
                formula = ' '.join(math_lines)
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after  = Pt(4)
            p.paragraph_format.left_indent  = Cm(1)
            run = p.add_run(formula)
            run.font.name  = 'Cambria Math'
            run.font.size  = Pt(10)
            run.italic     = True
            run.font.color.rgb = RGBColor(0x1A, 0x52, 0x76)
            # Shaded background
            pPr  = p._p.get_or_add_pPr()
            shd  = OxmlElement('w:shd')
            shd.set(qn('w:val'),   'clear')
            shd.set(qn('w:color'), 'auto')
            shd.set(qn('w:fill'),  'EBF5FB')
            pPr.append(shd)
            continue

        # ── Blockquote / callout ─────────────────────────────────────────────
        if raw.strip().startswith('>'):
            text = raw.strip().lstrip('> ').strip()
            p = doc.add_paragraph()
            p.paragraph_format.left_indent  = Cm(0.8)
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after  = Pt(2)
            pPr = p._p.get_or_add_pPr()
            pBdr = OxmlElement('w:pBdr')
            left = OxmlElement('w:left')
            left.set(qn('w:val'),   'single')
            left.set(qn('w:sz'),    '12')
            left.set(qn('w:space'), '8')
            left.set(qn('w:color'), '00B0B0')
            pBdr.append(left)
            pPr.append(pBdr)
            render_inline(p, text, base_color=MID_GRAY, base_size=9)
            continue

        # ── Bullet list ──────────────────────────────────────────────────────
        m_li = re.match(r'^(\s*)[-*]\s+(.*)', raw)
        if m_li:
            indent = len(m_li.group(1)) // 2
            text   = m_li.group(2)
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.left_indent  = Cm(0.5 + indent * 0.5)
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after  = Pt(1)
            for run in list(p.runs):
                p._p.remove(run._r)
            render_inline(p, text, base_size=10)
            continue

        # ── Numbered list ────────────────────────────────────────────────────
        m_nl = re.match(r'^\s*\d+\.\s+(.*)', raw)
        if m_nl:
            text = m_nl.group(1)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after  = Pt(1)
            for run in list(p.runs):
                p._p.remove(run._r)
            render_inline(p, text, base_size=10)
            continue

        # ── Italic-only line (e.g. footer) ───────────────────────────────────
        if raw.strip().startswith('*') and raw.strip().endswith('*'):
            text = raw.strip().strip('*')
            p = doc.add_paragraph()
            run = p.add_run(text)
            run.italic = True
            run.font.size = Pt(8)
            run.font.color.rgb = MID_GRAY
            continue

        # ── Normal paragraph ─────────────────────────────────────────────────
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after  = Pt(4)
        render_inline(p, raw.strip())

    # Final flushes
    if in_code_block:
        flush_code()
    if in_table:
        flush_table()

    doc.save(out_path)
    print(f"Saved: {out_path}")


if __name__ == '__main__':
    import os
    base = os.path.dirname(os.path.abspath(__file__))
    build_docx(
        md_path  = os.path.join(base, 'MEMORIAL_DE_CALCULO.md'),
        out_path = os.path.join(base, 'MEMORIAL_DE_CALCULO.docx'),
    )
