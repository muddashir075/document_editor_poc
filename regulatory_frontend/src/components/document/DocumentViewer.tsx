import { useRef, useState, useEffect, useCallback } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useUpdateDocument } from '@/hooks/useDocuments'
import { Button } from '@/components/ui/Button'
import type { Document } from '@/types'
import DocumentToolbar from './DocumentToolbar'

interface Props {
  document: Document
  onlineUsers: string[]
}

export function DocumentViewer({ document, onlineUsers }: Props) {
  const { setSelectedParagraphId, setSelection } = useUiStore()
  const { user, isAdmin } = useAuthStore()
  const updateDoc = useUpdateDocument(document.id)
  // Only admins can edit document content directly
  const canEdit = isAdmin

  const [editMode, setEditMode] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const viewRef = useRef<HTMLDivElement>(null)
  const editRef = useRef<HTMLDivElement>(null)

  // Populate contentEditable when entering edit mode
  useEffect(() => {
    if (editMode && editRef.current) {
      editRef.current.innerHTML = document.content
      editRef.current.focus()
    }
  }, [editMode, document.content])

  // Track active formats for toolbar highlight
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>()
    if (window.document.queryCommandState('bold')) formats.add('bold')
    if (window.document.queryCommandState('italic')) formats.add('italic')
    if (window.document.queryCommandState('underline')) formats.add('underline')
    
    // Detect block type
    try {
      const block = window.document.queryCommandValue('formatBlock')
      if (block) formats.add(block.toLowerCase())
      
      let font = window.document.queryCommandValue('fontName')
      if (font) {
        // Strip quotes like 'Arial' or "Arial"
        font = font.replace(/['"]/g, '')
        formats.add(`font-${font.toLowerCase().replace(/\s/g, '-')}`)
      }
      
      const size = window.document.queryCommandValue('fontSize')
      if (size) formats.add(`size-${size}`)
    } catch (e) {}

    setActiveFormats(formats)
  }, [])

  // ── Text selection → paragraph anchor ──────────────────────────────────────
  const handleMouseUp = () => {
    if (editMode) { updateActiveFormats(); return }
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const text = selection.toString().trim()
    if (!text) return
    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer as HTMLElement
    const para = container.nodeType === 3
      ? container.parentElement?.closest('[data-pid]')
      : (container as HTMLElement).closest('[data-pid]')
    const pid = para?.getAttribute('data-pid') ?? null
    setSelection(text, { start: range.startOffset, end: range.endOffset })
    if (pid) setSelectedParagraphId(pid)
  }

  // ── Save / Cancel ───────────────────────────────────────────────────────────
  const handleToolbarAction = (command: string, value?: string) => {
    if (!editRef.current) return;
    editRef.current.focus();

    if (command === 'insertTable') insertTable();
    else if (command === 'addRowAbove') addRowAbove();
    else if (command === 'addRowBelow') addRowBelow();
    else if (command === 'deleteRow') deleteRow();
    else if (command === 'addColumnRight') addColumnRight();
    else if (command === 'addColumnLeft') addColumnLeft();
    else if (command === 'deleteColumn') deleteColumn();
    else if (command === 'fontSizeIncrease') {
      const cur = parseInt(window.document.queryCommandValue('fontSize')) || 3;
      window.document.execCommand('fontSize', false, Math.min(7, cur + 1).toString());
    }
    else if (command === 'fontSizeDecrease') {
      const cur = parseInt(window.document.queryCommandValue('fontSize')) || 3;
      window.document.execCommand('fontSize', false, Math.max(1, cur - 1).toString());
    }
    else if (command === 'insertPageBreak') {
      window.document.execCommand('insertHTML', false, '<span class="page-break"></span>');
    }
    else if (command === 'formatBlock') window.document.execCommand('formatBlock', false, value);
    else window.document.execCommand(command, false, value);

    updateActiveFormats();
    
    // Trigger the onInput handler manually to sync state
    const event = new Event('input', { bubbles: true });
    editRef.current.dispatchEvent(event);
  };

  const handleSave = () => {
    const html = editRef.current?.innerHTML ?? document.content
    updateDoc.mutate(
      { data: { content: html }, updatedBy: user },
      { onSuccess: () => setEditMode(false) }
    )
  }

  const handleCancel = () => {
    if (editRef.current) editRef.current.innerHTML = document.content
    setEditMode(false)
  }

  // ── Table helpers ───────────────────────────────────────────────────────────
  /** Returns the <td> or <th> the cursor is currently inside, if any */
  const getActiveCell = (): HTMLTableCellElement | null => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    let node: Node | null = sel.getRangeAt(0).startContainer
    while (node && node !== editRef.current) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH')
        return node as HTMLTableCellElement
      node = node.parentNode
    }
    return null
  }

  const getActiveTable = (): HTMLTableElement | null => {
    const cell = getActiveCell()
    if (!cell) return null
    let node: Node | null = cell
    while (node && node !== editRef.current) {
      if (node.nodeName === 'TABLE') return node as HTMLTableElement
      node = node.parentNode
    }
    return null
  }

  /** Apply consistent inline border styles to a newly created cell */
  const styleCell = (cell: HTMLTableCellElement) => {
    cell.style.border = '1px solid #cbd5e1'
    cell.style.padding = '10px 14px'
    cell.style.verticalAlign = 'top'
    cell.style.minWidth = '80px'
  }

  const addRowBelow = () => {
    const cell = getActiveCell()
    const table = getActiveTable()
    if (!cell || !table) { alert('Click inside a table cell first.'); return }
    const row = cell.closest('tr') as HTMLTableRowElement
    const colCount = row.cells.length
    const newRow = table.insertRow(row.rowIndex + 1)
    for (let i = 0; i < colCount; i++) {
      const td = newRow.insertCell(i)
      td.innerHTML = '&nbsp;'
      styleCell(td)
    }
  }

  const addRowAbove = () => {
    const cell = getActiveCell()
    const table = getActiveTable()
    if (!cell || !table) { alert('Click inside a table cell first.'); return }
    const row = cell.closest('tr') as HTMLTableRowElement
    const colCount = row.cells.length
    const newRow = table.insertRow(row.rowIndex)
    for (let i = 0; i < colCount; i++) {
      const td = newRow.insertCell(i)
      td.innerHTML = '&nbsp;'
      styleCell(td)
    }
  }

  const deleteRow = () => {
    const cell = getActiveCell()
    const table = getActiveTable()
    if (!cell || !table) { alert('Click inside a table cell first.'); return }
    const row = cell.closest('tr') as HTMLTableRowElement
    if (table.rows.length <= 1) { alert('Cannot delete the only row.'); return }
    table.deleteRow(row.rowIndex)
  }

  const addColumnRight = () => {
    const cell = getActiveCell()
    const table = getActiveTable()
    if (!cell || !table) { alert('Click inside a table cell first.'); return }
    const colIdx = cell.cellIndex + 1
    Array.from(table.rows).forEach(row => {
      const newCell = row.insertCell(colIdx)
      newCell.innerHTML = '&nbsp;'
      styleCell(newCell)
    })
  }

  const addColumnLeft = () => {
    const cell = getActiveCell()
    const table = getActiveTable()
    if (!cell || !table) { alert('Click inside a table cell first.'); return }
    const colIdx = cell.cellIndex
    Array.from(table.rows).forEach(row => {
      const newCell = row.insertCell(colIdx)
      newCell.innerHTML = '&nbsp;'
      styleCell(newCell)
    })
  }

  const deleteColumn = () => {
    const cell = getActiveCell()
    const table = getActiveTable()
    if (!cell || !table) { alert('Click inside a table cell first.'); return }
    const colIdx = cell.cellIndex
    if (table.rows[0]?.cells.length <= 1) { alert('Cannot delete the only column.'); return }
    Array.from(table.rows).forEach(row => row.deleteCell(colIdx))
  }

  const insertTable = () => {
    editRef.current?.focus()
    const rows = 3, cols = 3
    const cellStyle = 'border:1px solid #cbd5e1;padding:10px 14px;vertical-align:top;min-width:80px;'
    const thStyle = cellStyle + 'background:#f8fafc;font-weight:600;color:#1e293b;'
    let html = '<table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px;"><thead><tr>'
    for (let c = 0; c < cols; c++) html += `<th style="${thStyle}">Header ${c + 1}</th>`
    html += '</tr></thead><tbody>'
    for (let r = 0; r < rows - 1; r++) {
      html += '<tr>'
      for (let c = 0; c < cols; c++) html += `<td style="${cellStyle}">&nbsp;</td>`
      html += '</tr>'
    }
    html += '</tbody></table><p><br></p>'
    window.document.execCommand('insertHTML', false, html)
  }

  const wrappedHtml = injectTableStyles(wrapTopLevelBlocks(document.content))
  
  // Split content into physical pages for View Mode
  // The backend uses <span class="page-break">...</span> for breaks
  const viewPages = wrappedHtml.split(/<span class="page-break">.*?<\/span>/gi);

  return (
    <div style={styles.wrapper}>
      {/* ── Top toolbar ── */}
      <div style={styles.container}>
        {editMode && (
          <DocumentToolbar 
            onAction={handleToolbarAction} 
            activeFormats={activeFormats}
            disabled={false} 
          />
        )}
        <div style={styles.header}>
          {document.original_filename && (
            <span style={styles.filename}>📄 {document.original_filename}</span>
          )}
          {editMode && <span style={styles.editBadge}>Editing</span>}
        </div>
        <div style={styles.toolbarRight}>
          {onlineUsers.length > 0 && (
            <div style={styles.presence}>
              {onlineUsers.map(u => (
                <span key={u} style={styles.avatar} title={u}>{u[0].toUpperCase()}</span>
              ))}
              <span style={styles.onlineCount}>{onlineUsers.length} online</span>
            </div>
          )}
          {!editMode ? (
            canEdit && (
              <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}>✏️ Edit</Button>
            )
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" onClick={handleSave} disabled={updateDoc.isPending}>
                {updateDoc.isPending ? 'Saving…' : '💾 Save'}
              </Button>
              <Button size="sm" variant="secondary" onClick={handleCancel}>Cancel</Button>
            </div>
          )}
        </div>
      </div>


      {/* ── Main Workspace ── */}
      <div style={styles.content}>
        {/* ── View mode: Paginated ── */}
        {!editMode && viewPages.map((pContent, i) => (
          <div
            key={i}
            className="doc-viewer"
            style={styles.page}
            dangerouslySetInnerHTML={{ __html: pContent }}
          />
        ))}

        {/* ── Edit mode: Single continuous flow with visual breaks ── */}
        <div
          ref={editRef}
          contentEditable={editMode}
          suppressContentEditableWarning
          onKeyUp={updateActiveFormats}
          onMouseUp={handleMouseUp}
          className="doc-viewer doc-editable"
          style={{
            ...styles.page,
            ...styles.editableContent,
            display: editMode ? 'block' : 'none',
            minHeight: '2000px', // Allow scrolling in edit mode
          }}
          dangerouslySetInnerHTML={editMode ? { __html: document.content } : undefined}
        />
      </div>
    </div>
  )
}


// ── Wrap top-level blocks with data-pid for comment anchoring ───────────────
function wrapTopLevelBlocks(html: string): string {
  let idx = 0
  return html.replace(
    /(<(p|h[1-6]|table|ul|ol|blockquote)(\s[^>]*)?>)/gi,
    (_match, _full, tag, attrs = '') => {
      idx++
      return `<${tag}${attrs} data-pid="p-${idx}">`
    }
  )
}

// ── Inject inline styles on tables so borders always show ──────────────────
// This is the most reliable approach — no CSS cascade can override inline styles.
function injectTableStyles(html: string): string {
  return html
    // <table ...> → add inline border-collapse + width
    .replace(
      /<table(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<table${attrs} style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px;">`
    )
    // <td ...> → add inline border + padding
    .replace(
      /<td(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<td${attrs} style="border:1px solid #cbd5e1;padding:10px 14px;vertical-align:top;min-width:80px;">`
    )
    // <th ...> → add inline border + padding + background
    .replace(
      /<th(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<th${attrs} style="border:1px solid #cbd5e1;padding:10px 14px;vertical-align:top;min-width:80px;background:#f8fafc;font-weight:600;color:#1e293b;">`
    )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column' as const, height: '100%' },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 12, marginBottom: 8, borderBottom: '1px solid #f1f5f9', flexShrink: 0,
  },
  editToolbar: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap' as const, gap: 4,
    padding: '6px 0 10px', marginBottom: 8,
    borderBottom: '1px solid #e2e8f0', flexShrink: 0,
    zIndex: 10,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px',
  },
  fileInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  filename: { fontSize: 13, color: '#1e293b', fontWeight: 600 },
  editBadge: {
    fontSize: 11, background: '#fef3c7', color: '#92400e',
    padding: '2px 8px', borderRadius: 9999, fontWeight: 600,
  },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 12 },
  presence: { display: 'flex', alignItems: 'center', gap: 6 },
  avatar: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 24, height: 24, borderRadius: '50%', background: '#2563eb',
    color: '#fff', fontSize: 11, fontWeight: 700,
  },
  onlineCount: { fontSize: 11, color: '#64748b' },
  content: {
    flex: 1, 
    overflowY: 'auto' as const,
    padding: '40px 0', // Padding for the workspace
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  page: {
    width: '816px', // A4 Width at 96 DPI
    minHeight: '1056px', // A4 Height
    padding: '96px', // Standard 1-inch margins
    background: '#fff',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    margin: '0 auto 20px',
    lineHeight: 1.6, 
    fontSize: 16, 
    color: '#334155',
    position: 'relative' as const,
  },
  editableContent: {
    outline: 'none',
    cursor: 'text',
  },
}

// ── Global styles for the viewer (tables, headings, etc.) ───────────────────
// Always remove and re-inject so hot-reload picks up changes
const _existing = typeof document !== 'undefined' && document.getElementById('doc-viewer-style')
if (_existing) _existing.remove()
if (typeof document !== 'undefined') {
  const s = document.createElement('style')
  s.id = 'doc-viewer-style'
  s.textContent = `
    /* ── Tables ── */
    .doc-viewer table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      font-size: 15px;
    }
    .doc-viewer td, .doc-viewer th {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      vertical-align: top;
      min-width: 80px;
    }
    .doc-viewer th {
      background: #f8fafc;
      font-weight: 600;
      color: #1e293b;
    }
    /* Highlight cell on hover in edit mode */
    .doc-editable td:hover, .doc-editable th:hover {
      outline: 2px solid #3b82f6;
      outline-offset: -2px;
    }
    /* ── Headings ── */
    .doc-viewer h1 { font-size: 32px; font-weight: 700; margin: 32px 0 16px; color: #0f172a; line-height: 1.2; }
    .doc-viewer h2 { font-size: 24px; font-weight: 600; margin: 28px 0 12px; color: #1e293b; line-height: 1.3; }
    .doc-viewer h3 { font-size: 20px; font-weight: 600; margin: 24px 0 8px; color: #334155; line-height: 1.4; }
    .doc-viewer h4 { font-size: 18px; font-weight: 600; margin: 20px 0 8px; color: #475569; line-height: 1.4; }
    /* ── Lists ── */
    .doc-viewer ul, .doc-viewer ol { padding-left: 32px; margin: 12px 0; }
    .doc-viewer li { margin-bottom: 6px; }
    /* ── Paragraphs ── */
    .doc-viewer p  { margin: 0 0 12px; min-height: 1.2em; }
    .doc-viewer strong { font-weight: 700; }
    .doc-viewer em { font-style: italic; }
    .doc-viewer u { text-decoration: underline; text-decoration-color: #2563eb; }

    /* ── Alignment helpers (Mammoth classes) ── */
    .doc-viewer .text-center { text-align: center !important; }
    .doc-viewer .text-right { text-align: right !important; }
    .doc-viewer .text-justify { text-align: justify !important; }

    /* ── Alignment helpers (Inline styles if present) ── */
    .doc-viewer [style*="text-align: center"], .doc-viewer [style*="text-align:center"] { text-align: center; }
    .doc-viewer [style*="text-align: right"], .doc-viewer [style*="text-align:right"] { text-align: right; }
    .doc-viewer [style*="text-align: justify"], .doc-viewer [style*="text-align:justify"] { text-align: justify; }

    /* ── Page Break ── */
    .page-break {
      display: block;
      height: 40px; /* Physical gap */
      margin: 40px -96px; /* Extend into page margins to hit workspace edges */
      background: #cbd5e1; /* Must match workspace background */
      box-shadow: inset 0 10px 10px -10px rgba(0,0,0,0.15), inset 0 -10px 10px -10px rgba(0,0,0,0.15);
      position: relative;
      user-select: none;
      pointer-events: none;
      width: calc(100% + 192px);
      clear: both;
    }
    .page-break::after {
      content: 'PAGE BREAK';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 3px;
      background: #cbd5e1;
      padding: 0 15px;
    }
    /* Hide the marker character inside the span */
    .page-break { color: transparent; font-size: 0; }

    /* ── Branding Header/Footer ── */
    .doc-header { user-select: none; pointer-events: none; margin-bottom: 40px; }
    .doc-footer { user-select: none; pointer-events: none; margin-top: 40px; }
    .doc-header img, .doc-footer img { display: inline-block; }
  `
  document.head.appendChild(s)
}
