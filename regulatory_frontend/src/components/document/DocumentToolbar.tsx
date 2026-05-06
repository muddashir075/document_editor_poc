import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Undo, Redo, Bold, Italic, Underline as UnderlineIcon, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List, ListOrdered, Type, Table as TableIcon,
  PlusSquare, Trash2, Eraser, 
  ChevronDown, Highlighter, Palette
} from 'lucide-react';

interface DocumentToolbarProps {
  editor: Editor | null;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({ editor }) => {
  const textColorRef = useRef<HTMLInputElement>(null);
  const highlightColorRef = useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }

  const Group: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 6px', borderRight: '1px solid #e2e8f0' }}>
      {children}
    </div>
  );

  const Button: React.FC<{ 
    onClick?: (e: React.MouseEvent) => void; 
    title: string; 
    active?: boolean;
    danger?: boolean;
    disabled?: boolean;
    children: React.ReactNode 
  }> = ({ onClick, title, active, danger, disabled, children }) => (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '32px',
        height: '32px',
        padding: '0 6px',
        borderRadius: '4px',
        border: 'none',
        background: active ? '#eff6ff' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: active ? '#2563eb' : danger ? '#dc2626' : '#475569',
        transition: 'all 0.2s',
        fontSize: '13px',
        fontWeight: active ? '600' : 'normal',
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.backgroundColor = active ? '#eff6ff' : '#f1f5f9')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = active ? '#eff6ff' : 'transparent')}
    >
      {children}
    </button>
  );

  const fonts = [
    'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Roboto', 'Inter', 'Montserrat'
  ];

  const fontSizes = [
    { label: '10', value: '10px' },
    { label: '12', value: '12px' },
    { label: '14', value: '14px' },
    { label: '16', value: '16px' },
    { label: '18', value: '18px' },
    { label: '20', value: '20px' },
    { label: '24', value: '24px' },
    { label: '32', value: '32px' },
    { label: '48', value: '48px' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '4px 8px',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '2px',
      flexWrap: 'wrap',
      minHeight: '40px'
    }}>
      <Group>
        <Button onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
          <Undo size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
          <Redo size={16} />
        </Button>
      </Group>

      <Group>
        <select 
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          style={{
            height: '32px',
            border: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: '#475569',
            padding: '0 4px',
            cursor: 'pointer',
            outline: 'none',
            borderRadius: '4px',
            minWidth: '100px'
          }}
        >
          <option value="">Font</option>
          {fonts.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Group>

      <Group>
        <select 
          value={editor.getAttributes('textStyle').fontSize || '16px'}
          onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
          style={{
            height: '32px',
            border: 'none',
            background: 'transparent',
            fontSize: '13px',
            color: '#475569',
            padding: '0 4px',
            cursor: 'pointer',
            outline: 'none',
            borderRadius: '4px',
            minWidth: '60px'
          }}
        >
          {fontSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </Group>

      <Group>
        <Button 
          onClick={() => editor.chain().focus().setParagraph().run()} 
          title="Normal Text" 
          active={editor.isActive('paragraph')}
        >
          P
        </Button>
        <Button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
          title="Heading 1" 
          active={editor.isActive('heading', { level: 1 })}
        >
          H1
        </Button>
        <Button 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
          title="Heading 2" 
          active={editor.isActive('heading', { level: 2 })}
        >
          H2
        </Button>
      </Group>

      <Group>
        <Button 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          title="Bold" 
          active={editor.isActive('bold')}
        >
          <Bold size={16} strokeWidth={3} />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          title="Italic" 
          active={editor.isActive('italic')}
        >
          <Italic size={16} />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().toggleUnderline().run()} 
          title="Underline" 
          active={editor.isActive('underline')}
        >
          <UnderlineIcon size={16} />
        </Button>
        
        {/* Text Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Button onClick={() => textColorRef.current?.click()} title="Text Color">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Palette size={16} />
              <div style={{ 
                width: '12px', 
                height: '3px', 
                background: editor.getAttributes('textStyle').color || '#000', 
                marginTop: '1px' 
              }} />
            </div>
          </Button>
          <input 
            ref={textColorRef}
            type="color" 
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer', border: 'none', padding: 0 }}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </div>

        {/* Highlight Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Button onClick={() => highlightColorRef.current?.click()} title="Highlight Color">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Highlighter size={16} />
              <div style={{ 
                width: '12px', 
                height: '3px', 
                background: editor.getAttributes('highlight').color || '#ffff00', 
                marginTop: '1px' 
              }} />
            </div>
          </Button>
          <input 
            ref={highlightColorRef}
            type="color" 
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer', border: 'none', padding: 0 }}
            onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
          />
        </div>
      </Group>

      <Group>
        <Button 
          onClick={() => editor.chain().focus().setTextAlign('left').run()} 
          title="Align Left"
          active={editor.isActive({ textAlign: 'left' })}
        >
          <AlignLeft size={16} />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().setTextAlign('center').run()} 
          title="Align Center"
          active={editor.isActive({ textAlign: 'center' })}
        >
          <AlignCenter size={16} />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().setTextAlign('right').run()} 
          title="Align Right"
          active={editor.isActive({ textAlign: 'right' })}
        >
          <AlignRight size={16} />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
          title="Justify"
          active={editor.isActive({ textAlign: 'justify' })}
        >
          <AlignJustify size={16} />
        </Button>
      </Group>

      <Group>
        <Button 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          title="Bulleted List"
          active={editor.isActive('bulletList')}
        >
          <List size={16} />
        </Button>
        <Button 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          title="Numbered List"
          active={editor.isActive('orderedList')}
        >
          <ListOrdered size={16} />
        </Button>
      </Group>

      <Group>
        <Button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
          <TableIcon size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row Below" disabled={!editor.isActive('table')}>
          <PlusSquare size={16} />
        </Button>
        <Button onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Col Right" disabled={!editor.isActive('table')}>
          <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
        </Button>
        <Button onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table" danger disabled={!editor.isActive('table')}>
          <Trash2 size={16} />
        </Button>
      </Group>

      <Group>
        <Button onClick={() => editor.commands.setPageBreak()} title="Insert Page Break">
          <Type size={16} />
        </Button>
      </Group>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
        <Button onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
          <Eraser size={16} />
        </Button>
      </div>
    </div>
  );
};

export default DocumentToolbar;
