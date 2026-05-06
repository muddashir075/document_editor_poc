import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Image } from '@tiptap/extension-image'

import { FontSize } from './extensions/FontSize'
import { PageBreak } from './extensions/PageBreak'

import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useUpdateDocument } from '@/hooks/useDocuments'
import { Button } from '@/components/ui/Button'
import type { Document } from '@/types'
import DocumentToolbar from './DocumentToolbar'

const PAGE_HEIGHT = 1123;  // A4 at 96dpi
const PAGE_WIDTH  = 794;
const PAGE_MARGIN = 96;    // ~1 inch

interface Props {
  document: Document
  onlineUsers: string[]
}

export function DocumentViewer({ document, onlineUsers }: Props) {
  const { setSelectedParagraphId, setSelection } = useUiStore()
  const { user, isAdmin } = useAuthStore()
  const updateDoc = useUpdateDocument(document.id)
  const canEdit = isAdmin

  const [editMode, setEditMode] = useState(false)
  const [dynamicPages, setDynamicPages] = useState<string[][]>([])
  const measureRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image,
      PageBreak,
    ],
    content: document.content,
    editable: editMode,
  })

  // Sync editMode with editor
  useEffect(() => {
    if (editor) {
      editor.setEditable(editMode)
      if (editMode) {
        editor.commands.setContent(document.content)
      }
    }
  }, [editMode, editor, document.content])

  // ── Dynamic Pagination Logic ────────────────────────────────────────────────
  useEffect(() => {
    if (!measureRef.current || editMode) return;

    // Use a small delay to ensure DOM is rendered in the hidden container
    const timer = setTimeout(() => {
      const container = measureRef.current;
      if (!container) return;

      const children = Array.from(container.children);
      const usableHeight = PAGE_HEIGHT - PAGE_MARGIN * 2;
      const pageGroups: string[][] = [];
      let currentGroup: string[] = [];
      let currentHeight = 0;

      children.forEach((child) => {
        const childHeight = child.getBoundingClientRect().height;
        const style = window.getComputedStyle(child);
        const childMargin = parseFloat(style.marginTop) + parseFloat(style.marginBottom);
        const totalHeight = childHeight + childMargin;

        // If this element overflows a page
        if (currentHeight + totalHeight > usableHeight && currentGroup.length > 0) {
          pageGroups.push(currentGroup);
          currentGroup = [child.outerHTML];
          currentHeight = totalHeight;
        } else {
          currentGroup.push(child.outerHTML);
          currentHeight += totalHeight;
        }
      });

      if (currentGroup.length > 0) {
        pageGroups.push(currentGroup);
      }

      setDynamicPages(pageGroups);
    }, 100);

    return () => clearTimeout(timer);
  }, [document.content, editMode]);

  // ── Text selection → paragraph anchor ──────────────────────────────────────
  const handleMouseUp = () => {
    if (editMode) return
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
    const html = editor?.getHTML() ?? document.content
    updateDoc.mutate(
      { data: { content: html }, updatedBy: user },
      { onSuccess: () => setEditMode(false) }
    )
  }

  const handleCancel = () => {
    if (editor) editor.commands.setContent(document.content)
    setEditMode(false)
  }

  const processedHtml = injectTableStyles(wrapTopLevelBlocks(document.content))
  
  // Extract headers and footers from the block markers
  const headerMatch = processedHtml.match(/<div class="doc-header-block">([\s\S]*?)<\/div>/);
  const footerMatch = processedHtml.match(/<div class="doc-footer-block">([\s\S]*?)<\/div>/);
  const headerHtml = headerMatch ? headerMatch[1] : '';
  const footerHtml = footerMatch ? footerMatch[1] : '';

  // Filter out header/footer blocks from the body content for measurement
  const bodyContentForMeasurement = processedHtml
    .replace(/<div class="doc-header-block">[\s\S]*?<\/div>/, '')
    .replace(/<div class="doc-footer-block">[\s\S]*?<\/div>/, '');

  return (
    <div style={styles.wrapper}>
      {/* ── Top toolbar ── */}
      <div style={styles.container}>
        {editMode && (
          <DocumentToolbar 
            editor={editor} 
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
        {/* Hidden measurement container */}
        <div
          ref={measureRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            width: `${PAGE_WIDTH - PAGE_MARGIN * 2}px`,
            padding: `0`, // Measurement is within the usable area
            lineHeight: 1.6,
            fontSize: 16,
            color: '#334155',
            pointerEvents: 'none',
          }}
          className="doc-viewer"
          dangerouslySetInnerHTML={{ __html: bodyContentForMeasurement }}
        />

        {/* ── View mode: Paginated ── */}
        {!editMode && dynamicPages.map((group, i) => (
          <div
            key={i}
            className="doc-viewer"
            style={styles.page}
            onMouseUp={handleMouseUp}
          >
            {headerHtml && (
              <div 
                className="doc-header-repeated" 
                style={{ marginBottom: 40, borderBottom: '1px solid #eee', paddingBottom: 10, fontSize: 12, color: '#64748b' }}
                dangerouslySetInnerHTML={{ __html: headerHtml }} 
              />
            )}
            
            <div dangerouslySetInnerHTML={{ __html: group.join('') }} />
            
            {footerHtml && (
              <div 
                className="doc-footer-repeated" 
                style={{ marginTop: 40, borderTop: '1px solid #eee', paddingTop: 10, fontSize: 12, color: '#64748b' }}
                dangerouslySetInnerHTML={{ __html: footerHtml }} 
              />
            )}
            
            <div style={styles.pageNumber}>Page {i + 1} of {dynamicPages.length}</div>
          </div>
        ))}

        {/* ── Edit mode: Single continuous flow ── */}
        <div
          className="doc-viewer doc-editable"
          style={{
            ...styles.page,
            ...styles.editableContent,
            display: editMode ? 'block' : 'none',
            minHeight: '2000px',
          }}
        >
          <EditorContent editor={editor} />
        </div>
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
function injectTableStyles(html: string): string {
  return html
    .replace(
      /<table(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<table${attrs} style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px;">`
    )
    .replace(
      /<td(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<td${attrs} style="border:1px solid #cbd5e1;padding:10px 14px;vertical-align:top;min-width:80px;">`
    )
    .replace(
      /<th(\s[^>]*)?>/gi,
      (_m, attrs = '') =>
        `<th${attrs} style="border:1px solid #cbd5e1;padding:10px 14px;vertical-align:top;min-width:80px;background:#f8fafc;font-weight:600;color:#1e293b;">`
    )
}

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column' as const, height: '100%' },
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 16px', borderBottom: '1px solid #f1f5f9', background: '#fff',
  },
  header: { display: 'flex', alignItems: 'center', gap: 12 },
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
    padding: '40px 0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    background: '#cbd5e1', // Slightly darker for page contrast
  },
  page: {
    width: `${PAGE_WIDTH}px`,
    minHeight: `${PAGE_HEIGHT}px`,
    padding: `${PAGE_MARGIN}px`,
    background: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    margin: '0 auto 24px',
    lineHeight: 1.6, 
    fontSize: 16, 
    color: '#334155',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
  },
  editableContent: {
    outline: 'none',
    cursor: 'text',
  },
  pageNumber: {
    position: 'absolute' as const,
    bottom: 40,
    right: 40,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 500,
  },
}

// ── Global styles for the viewer ──────────────────────────────────────────
const _existing = typeof document !== 'undefined' && document.getElementById('doc-viewer-style')
if (_existing) _existing.remove()
if (typeof document !== 'undefined') {
  const s = document.createElement('style')
  s.id = 'doc-viewer-style'
  s.textContent = `
    .ProseMirror {
      outline: none;
      min-height: 100%;
    }
    .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: #adb5bd;
      pointer-events: none;
      height: 0;
    }
    /* ── Tables ── */
    .doc-viewer table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
      margin: 0;
      overflow: hidden;
    }
    .doc-viewer td, .doc-viewer th {
      min-width: 1em;
      border: 1px solid #cbd5e1;
      padding: 3px 5px;
      vertical-align: top;
      box-sizing: border-box;
      position: relative;
    }
    .doc-viewer td > *, .doc-viewer th > * {
      margin-bottom: 0;
    }
    .doc-viewer th {
      font-weight: bold;
      text-align: left;
      background-color: #f8fafc;
    }
    .doc-viewer .selectedCell:after {
      z-index: 2;
      position: absolute;
      content: "";
      left: 0; right: 0; top: 0; bottom: 0;
      background: rgba(200, 200, 255, 0.4);
      pointer-events: none;
    }
    .doc-viewer .column-resize-handle {
      position: absolute;
      right: -2px;
      top: 0;
      bottom: -2px;
      width: 4px;
      background-color: #adf;
      pointer-events: none;
    }
    .doc-viewer .tableWrapper {
      overflow-x: auto;
    }
    .doc-viewer .resize-cursor {
      cursor: ew-resize;
      cursor: col-resize;
    }

    /* ── Page Break ── */
    .page-break {
      display: block;
      height: 40px;
      margin: 40px -96px;
      background: #f1f5f9;
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
      color: #94a3b8;
      letter-spacing: 3px;
      background: #f1f5f9;
      padding: 0 15px;
    }
    
    /* ── Tiptap Task List ── */
    ul[data-type="taskList"] {
      list-style: none;
      padding: 0;
    }
    ul[data-type="taskList"] li {
      display: flex;
      align-items: center;
    }
    ul[data-type="taskList"] li > label {
      flex: 0 0 auto;
      margin-right: 0.5rem;
      user-select: none;
    }
    ul[data-type="taskList"] li > div {
      flex: 1 1 auto;
    }

    /* ── Headings ── */
    .doc-viewer h1 { font-size: 2.5rem; font-weight: 800; margin: 2rem 0 1rem; color: #0f172a; }
    .doc-viewer h2 { font-size: 1.8rem; font-weight: 700; margin: 1.5rem 0 0.75rem; color: #1e293b; }
    .doc-viewer h3 { font-size: 1.4rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #334155; }
    
    /* ── Alignment ── */
    .doc-viewer [style*="text-align: center"] { text-align: center; }
    .doc-viewer [style*="text-align: right"] { text-align: right; }
    .doc-viewer [style*="text-align: justify"] { text-align: justify; }
  `
  document.head.appendChild(s)
}
