import React, { useRef } from 'react';

interface DocumentToolbarProps {
  onAction: (command: string, value?: string) => void;
  activeFormats: Set<string>;
  disabled?: boolean;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({ onAction, activeFormats, disabled }) => {
  const textColorRef = useRef<HTMLInputElement>(null);
  const highlightColorRef = useRef<HTMLInputElement>(null);

  const handleAction = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    onAction(command, value);
  };

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
    preventFocusLoss?: boolean;
    children: React.ReactNode 
  }> = ({ onClick, title, active, danger, preventFocusLoss = true, children }) => (
    <button
      onMouseDown={(e) => preventFocusLoss && e.preventDefault()}
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

  const currentSize = Array.from(activeFormats).find(f => f.startsWith('size-'))?.split('-')[1] || '3';
  const sizeMap: { [key: string]: string } = { '1': '10', '2': '13', '3': '16', '4': '18', '5': '24', '6': '32', '7': '48' };
  
  const currentFontFormat = Array.from(activeFormats).find(f => f.startsWith('font-'));
  let currentFont = currentFontFormat ? currentFontFormat.replace('font-', '').replace(/-/g, ' ') : '';
  const matchedFont = fonts.find(f => f.toLowerCase() === currentFont.toLowerCase());
  currentFont = matchedFont || '';

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
        <Button onClick={(e) => handleAction(e, 'undo')} title="Undo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'redo')} title="Redo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
        </Button>
      </Group>

      <Group>
        <select 
          value={currentFont}
          onChange={(e) => onAction('fontName', e.target.value)}
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
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <option value="">Font</option>
          {fonts.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'fontSizeDecrease')} title="Decrease Font Size">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </Button>
        <div style={{ fontSize: '12px', minWidth: '24px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
          {sizeMap[currentSize] || '16'}
        </div>
        <Button onClick={(e) => handleAction(e, 'fontSizeIncrease')} title="Increase Font Size">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </Button>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'formatBlock', 'p')} title="Normal Text" active={activeFormats.has('p')}>
          Normal
        </Button>
        <Button onClick={(e) => handleAction(e, 'formatBlock', 'h1')} title="Heading 1" active={activeFormats.has('h1')}>
          H1
        </Button>
        <Button onClick={(e) => handleAction(e, 'formatBlock', 'h2')} title="Heading 2" active={activeFormats.has('h2')}>
          H2
        </Button>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'bold')} title="Bold" active={activeFormats.has('bold')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'italic')} title="Italic" active={activeFormats.has('italic')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'underline')} title="Underline" active={activeFormats.has('underline')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
        </Button>
        
        {/* Text Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Button onClick={() => textColorRef.current?.click()} title="Text Color" preventFocusLoss={false}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1 }}>A</span>
              <div style={{ width: '12px', height: '3px', background: '#000', marginTop: '1px' }} />
            </div>
          </Button>
          <input 
            ref={textColorRef}
            type="color" 
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer', border: 'none', padding: 0 }}
            onChange={(e) => onAction('foreColor', e.target.value)}
          />
        </div>

        {/* Highlight Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Button onClick={() => highlightColorRef.current?.click()} title="Highlight Color" preventFocusLoss={false}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 5 5"/><path d="m9.5 14.5 4 4"/></svg>
              <div style={{ width: '12px', height: '3px', background: '#ffff00', marginTop: '1px' }} />
            </div>
          </Button>
          <input 
            ref={highlightColorRef}
            type="color" 
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer', border: 'none', padding: 0 }}
            onChange={(e) => onAction('hiliteColor', e.target.value)}
          />
        </div>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'justifyLeft')} title="Align Left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'justifyCenter')} title="Align Center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'justifyRight')} title="Align Right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'justifyFull')} title="Justify">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
        </Button>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'insertUnorderedList')} title="Bulleted List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'insertOrderedList')} title="Numbered List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </Button>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'insertTable')} title="Insert Table">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'addRowAbove')} title="Add Row Above">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18"/><rect x="3" y="9" width="18" height="12" rx="2"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'addRowBelow')} title="Add Row Below">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="12" rx="2"/><path d="M3 21h18"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="10" y1="9" x2="14" y2="9"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'addColumnLeft')} title="Add Col Left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18"/><rect x="9" y="3" width="12" height="18" rx="2"/><line x1="13" y1="12" x2="17" y2="12"/><line x1="15" y1="10" x2="15" y2="14"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'addColumnRight')} title="Add Col Right">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 3v18"/><rect x="3" y="3" width="12" height="18" rx="2"/><line x1="7" y1="12" x2="11" y2="12"/><line x1="9" y1="10" x2="9" y2="14"/></svg>
        </Button>
        <Button onClick={(e) => handleAction(e, 'deleteRow')} title="Delete Row" danger>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        </Button>
      </Group>

      <Group>
        <Button onClick={(e) => handleAction(e, 'insertPageBreak')} title="Insert Page Break">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M19 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2"/><path d="M19 16v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2"/></svg>
        </Button>
      </Group>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
        <Button onClick={(e) => handleAction(e, 'removeFormat')} title="Clear Formatting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19L9 7H2"/><path d="M21 21L12 9"/><path d="M11 3h10"/></svg>
        </Button>
      </div>
    </div>
  );
};

export default DocumentToolbar;
