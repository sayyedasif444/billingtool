"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, List, ListOrdered, Heading2, 
  Underline as UnderlineIcon, Link as LinkIcon, 
  Code, Quote, Minus, Undo, Redo, Strikethrough 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const getExtensions = () => [
  StarterKit,
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline cursor-pointer',
    },
  }),
];

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: getExtensions(),
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert prose-tight max-w-none min-h-[120px] focus:outline-none p-3',
      },
    },
  });

  // Sync content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-white/10 rounded-md overflow-hidden bg-black/20 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
      <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-1 bg-white/5">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('underline') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('strike') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Strike-through"
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-slate-300'}`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded transition-colors hover:bg-white/10 text-slate-300"
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1 flex-grow" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded transition-colors hover:bg-white/10 text-slate-300 disabled:opacity-20"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded transition-colors hover:bg-white/10 text-slate-300 disabled:opacity-20"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
