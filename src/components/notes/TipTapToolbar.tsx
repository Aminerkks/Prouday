import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Link as LinkIcon,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  Palette
} from 'lucide-react';

interface TipTapToolbarProps {
  editor: Editor | null;
}

export const TipTapToolbar: React.FC<TipTapToolbarProps> = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL (e.g. https://...):', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const textColors = [
    { label: 'Default', value: 'inherit' },
    { label: 'Dark Gray', value: '#27272a' },
    { label: 'Medium Gray', value: '#71717a' },
    { label: 'Blue Gray', value: '#475569' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Rose', value: '#e11d48' },
  ];

  const activeBtn = 'bg-black/10 dark:bg-white/15 text-neutral-950 dark:text-white font-semibold';
  const inactiveBtn = 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300';

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] px-3 py-1.5 backdrop-blur-xs select-none sticky top-0 z-10 text-xs">
      {/* History */}
      <div className="flex items-center gap-0.5 pr-1 border-r border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-neutral-700 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-1 border-r border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded font-semibold text-xs flex items-center ${
            editor.isActive('heading', { level: 1 }) ? activeBtn : inactiveBtn
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded font-semibold text-xs flex items-center ${
            editor.isActive('heading', { level: 2 }) ? activeBtn : inactiveBtn
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded font-semibold text-xs flex items-center ${
            editor.isActive('heading', { level: 3 }) ? activeBtn : inactiveBtn
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Formatting Marks */}
      <div className="flex items-center gap-0.5 px-1 border-r border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded ${editor.isActive('bold') ? activeBtn : inactiveBtn}`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded ${editor.isActive('italic') ? activeBtn : inactiveBtn}`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded ${editor.isActive('underline') ? activeBtn : inactiveBtn}`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded ${editor.isActive('strike') ? activeBtn : inactiveBtn}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded ${
            editor.isActive('highlight')
              ? 'bg-black/15 text-neutral-900 dark:bg-white/20 dark:text-white'
              : inactiveBtn
          }`}
          title="Highlight text"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        {/* Text color selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className={`p-1.5 rounded ${inactiveBtn}`}
            title="Text color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-lg shadow-lg z-20 flex gap-1">
              {textColors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    if (c.value === 'inherit') editor.chain().focus().unsetColor().run();
                    else editor.chain().focus().setColor(c.value).run();
                    setShowColorPicker(false);
                  }}
                  className="w-5 h-5 rounded-full border border-neutral-300 dark:border-zinc-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.value === 'inherit' ? '#71717a' : c.value }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lists & Checklists */}
      <div className="flex items-center gap-0.5 px-1 border-r border-black/10 dark:border-white/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded ${editor.isActive('bulletList') ? activeBtn : inactiveBtn}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded ${editor.isActive('orderedList') ? activeBtn : inactiveBtn}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded ${editor.isActive('taskList') ? activeBtn : inactiveBtn}`}
          title="Checklist"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Blocks & Extras */}
      <div className="flex items-center gap-0.5 pl-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded ${editor.isActive('blockquote') ? activeBtn : inactiveBtn}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded ${editor.isActive('code') ? activeBtn : inactiveBtn}`}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded ${editor.isActive('codeBlock') ? activeBtn : inactiveBtn}`}
          title="Code Block"
        >
          <FileCode className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded ${editor.isActive('link') ? activeBtn : inactiveBtn}`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`p-1.5 rounded ${inactiveBtn}`}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
