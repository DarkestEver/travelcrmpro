import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code
} from 'lucide-react';

const HTMLEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const isUpdating = useRef(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isUpdating.current) {
      editorRef.current.innerHTML = value || '';
      
      // Set cursor at the very beginning
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(editorRef.current, 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }, 100);
    }
  }, [value]);

  const handleInput = (e) => {
    if (!isUpdating.current) {
      isUpdating.current = true;
      onChange(e.target.innerHTML);
      setTimeout(() => {
        isUpdating.current = false;
      }, 0);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    // Trigger change
    if (onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter the image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const ToolbarButton = ({ onClick, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      className="p-2 hover:bg-gray-100 rounded transition-colors"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
    >
      <Icon className="w-4 h-4 text-gray-700" />
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          onClick={() => execCommand('bold')}
          icon={Bold}
          title="Bold (Ctrl+B)"
        />
        <ToolbarButton
          onClick={() => execCommand('italic')}
          icon={Italic}
          title="Italic (Ctrl+I)"
        />
        <ToolbarButton
          onClick={() => execCommand('underline')}
          icon={Underline}
          title="Underline (Ctrl+U)"
        />
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => execCommand('insertUnorderedList')}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => execCommand('insertOrderedList')}
          icon={ListOrdered}
          title="Numbered List"
        />
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          onClick={() => execCommand('justifyLeft')}
          icon={AlignLeft}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => execCommand('justifyCenter')}
          icon={AlignCenter}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => execCommand('justifyRight')}
          icon={AlignRight}
          title="Align Right"
        />
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        <ToolbarButton
          onClick={insertLink}
          icon={Link}
          title="Insert Link"
        />
        <ToolbarButton
          onClick={insertImage}
          icon={Image}
          title="Insert Image"
        />
        <ToolbarButton
          onClick={() => execCommand('formatBlock', '<pre>')}
          icon={Code}
          title="Code Block"
        />
        
        <div className="w-px bg-gray-300 mx-1"></div>
        
        {/* Font Size */}
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          onMouseDown={(e) => e.preventDefault()}
        >
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
        
        {/* Heading */}
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          onMouseDown={(e) => e.preventDefault()}
        >
          <option value="">Heading</option>
          <option value="<h1>">Heading 1</option>
          <option value="<h2>">Heading 2</option>
          <option value="<h3>">Heading 3</option>
          <option value="<p>">Paragraph</option>
        </select>
        
        {/* Text Color */}
        <input
          type="color"
          onChange={(e) => execCommand('foreColor', e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="Text Color"
          onMouseDown={(e) => e.preventDefault()}
        />
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contentEditable=true]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          cursor: text;
        }
      `}</style>
    </div>
  );
};

export default HTMLEditor;
