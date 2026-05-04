import { useRef, useState, useEffect, useCallback } from 'react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useUpdateDocument } from '@/hooks/useDocuments'
import { Button } from '@/components/ui/Button'
import type { Document } from '@/types'

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

  // ── execCommand helpers ─────────────────────────────────────────────────────
  const exec = (cmd: string, value?: string) => {
    editRef.current?.focus()
    window.document.execCommand(cmd, false, value)
    updateActiveFormats()
  }

  const setHeading = (tag: string) => {
    editRef.current?.focus()
    window.document.execCommand('formatBlock', false, tag)
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
    cell.style.border = '1.5px solid #94a3b8'
    cell.style.padding = '8px 12px'
    cell.style.textAlign = 'left'
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
    const cellStyle = 'border:1.5px solid #94a3b8;padding:8px 12px;text-align:left;vertical-align:top;min-width:80px;'
    const thStyle = cellStyle + 'background:#f1f5f9;font-weight:600;color:#334155;'
    let html = '<table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:13px;"><thead><tr>'
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

  return (
    <div style={styles.wrapper}>
      {/* ── Top toolbar ── */}
      <div style={styles.toolbar}>
        <div style={styles.fileInfo}>
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

      {/* ── Rich edit toolbar (only in edit mode) ── */}
      {editMode && (
        <div style={styles.editToolbar}>
          {/* Formatting */}
          <div style={styles.toolGroup}>
            <ToolBtn active={activeFormats.has('bold')}    onClick={() => exec('bold')}      title="Bold (Ctrl+B)">B</ToolBtn>
            <ToolBtn active={activeFormats.has('italic')}  onClick={() => exec('italic')}    title="Italic (Ctrl+I)" style={{ fontStyle: 'italic' }}>I</ToolBtn>
            <ToolBtn active={activeFormats.has('underline')} onClick={() => exec('underline')} title="Underline (Ctrl+U)" style={{ textDecoration: 'underline' }}>U</ToolBtn>
          </div>

          <div style={styles.divider} />

          {/* Headings */}
          <div style={styles.toolGroup}>
            <ToolBtn onClick={() => setHeading('h1')} title="Heading 1">H1</ToolBtn>
            <ToolBtn onClick={() => setHeading('h2')} title="Heading 2">H2</ToolBtn>
            <ToolBtn onClick={() => setHeading('h3')} title="Heading 3">H3</ToolBtn>
            <ToolBtn onClick={() => setHeading('p')}  title="Normal paragraph">¶</ToolBtn>
          </div>

          <div style={styles.divider} />

          {/* Lists */}
          <div style={styles.toolGroup}>
            <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">• List</ToolBtn>
            <ToolBtn onClick={() => exec('insertOrderedList')}   title="Numbered list">1. List</ToolBtn>
          </div>

          <div style={styles.divider} />

          {/* Table — insert */}
          <div style={styles.toolGroup}>
            <ToolBtn onClick={insertTable} title="Insert a 3×3 table">⊞ Table</ToolBtn>
          </div>

          <div style={styles.divider} />

          {/* Table — row/col operations */}
          <div style={styles.toolGroup}>
            <ToolBtn onClick={addRowAbove}   title="Add row above cursor">↑ Row</ToolBtn>
            <ToolBtn onClick={addRowBelow}   title="Add row below cursor">↓ Row</ToolBtn>
            <ToolBtn onClick={deleteRow}     title="Delete current row" danger>✕ Row</ToolBtn>
          </div>
          <div style={styles.toolGroup}>
            <ToolBtn onClick={addColumnLeft}  title="Add column to the left">← Col</ToolBtn>
            <ToolBtn onClick={addColumnRight} title="Add column to the right">→ Col</ToolBtn>
            <ToolBtn onClick={deleteColumn}   title="Delete current column" danger>✕ Col</ToolBtn>
          </div>
        </div>
      )}

      {/* ── View mode ── */}
      <div
        ref={viewRef}
        onMouseUp={handleMouseUp}
        className="doc-viewer"
        style={{ ...styles.content, display: editMode ? 'none' : 'block' }}
        dangerouslySetInnerHTML={{ __html: wrappedHtml }}
      />

      {/* ── Edit mode: contentEditable ── */}
      <div
        ref={editRef}
        contentEditable={editMode}
        suppressContentEditableWarning
        onKeyUp={updateActiveFormats}
        onMouseUp={handleMouseUp}
        className="doc-viewer doc-editable"
        style={{
          ...styles.content,
          ...styles.editableContent,
          display: editMode ? 'block' : 'none',
        }}
      />
    </div>
  )
}

// ── Small toolbar button ────────────────────────────────────────────────────
function ToolBtn({
  children, onClick, title, active, danger, style: extraStyle,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  active?: boolean
  danger?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }} // preventDefault keeps focus in editor
      title={title}
      style={{
        padding: '3px 8px',
        borderRadius: 4,
        border: '1px solid',
        borderColor: active ? '#2563eb' : danger ? '#fca5a5' : '#e2e8f0',
        background: active ? '#eff6ff' : danger ? '#fff1f2' : '#fff',
        color: active ? '#2563eb' : danger ? '#dc2626' : '#374151',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        lineHeight: 1.4,
        ...extraStyle,
      }}
    >
      {children}
    </button>
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
        `<table${attrs} style="border-collapse:collapse;width:100%;margin:16px 0;font-size:13px;">`
    )
    // <td ...> → add inline border + padding
    .replace(
      /<td(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<td${attrs} style="border:1.5px solid #94a3b8;padding:8px 12px;text-align:left;vertical-align:top;min-width:80px;">`
    )
    // <th ...> → add inline border + padding + background
    .replace(
      /<th(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<th${attrs} style="border:1.5px solid #94a3b8;padding:8px 12px;text-align:left;vertical-align:top;min-width:80px;background:#f1f5f9;font-weight:600;color:#334155;">`
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
  },
  toolGroup: { display: 'flex', gap: 3 },
  divider: { width: 1, height: 22, background: '#e2e8f0', margin: '0 4px' },
  fileInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  filename: { fontSize: 12, color: '#2563eb', fontWeight: 500 },
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
    flex: 1, overflowY: 'auto' as const,
    maxWidth: 860, lineHeight: 1.8, fontSize: 14, color: '#1e293b',
  },
  editableContent: {
    outline: 'none', border: '2px solid #93c5fd',
    borderRadius: 8, padding: '16px 20px', minHeight: 400, cursor: 'text',
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
      border-collapse: collapse !important;
      width: 100% !important;
      margin: 16px 0 !important;
      font-size: 13px !important;
    }
    .doc-viewer td, .doc-viewer th {
      border: 1.5px solid #94a3b8 !important;
      padding: 8px 12px !important;
      text-align: left !important;
      vertical-align: top !important;
      min-width: 80px !important;
    }
    .doc-viewer th {
      background: #f1f5f9 !important;
      font-weight: 600 !important;
      color: #334155 !important;
    }
    .doc-viewer tr:nth-child(even) td { background: #f8fafc !important; }
    /* Highlight cell on hover in edit mode */
    .doc-editable td:hover, .doc-editable th:hover {
      outline: 2px solid #3b82f6 !important;
      outline-offset: -2px;
    }
    /* ── Headings ── */
    .doc-viewer h1 { font-size: 22px !important; font-weight: 700 !important; margin: 24px 0 8px !important; color: #0f172a !important; }
    .doc-viewer h2 { font-size: 18px !important; font-weight: 600 !important; margin: 20px 0 6px !important; color: #1e293b !important; }
    .doc-viewer h3 { font-size: 15px !important; font-weight: 600 !important; margin: 16px 0 4px !important; color: #334155 !important; }
    .doc-viewer h4 { font-size: 14px !important; font-weight: 600 !important; margin: 12px 0 4px !important; color: #475569 !important; }
    /* ── Lists ── */
    .doc-viewer ul, .doc-viewer ol { padding-left: 24px !important; margin: 8px 0 !important; }
    .doc-viewer li { margin-bottom: 4px !important; }
    /* ── Paragraphs ── */
    .doc-viewer p  { margin: 0 0 10px !important; }
    .doc-viewer strong { font-weight: 600 !important; }
    .doc-viewer em { font-style: italic !important; }
  `
  document.head.appendChild(s)
}
