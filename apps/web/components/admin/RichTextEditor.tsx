'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your post…',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-stone dark:prose-invert max-w-none min-h-[280px] px-4 py-3 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const btn =
    'rounded px-2 py-1 text-xs font-medium border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800';
  const active = 'bg-stone-200 dark:bg-stone-700';

  return (
    <div className="overflow-hidden rounded-lg border border-stone-300 dark:border-stone-700">
      <div className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 p-2 dark:border-stone-800 dark:bg-stone-900">
        <button
          type="button"
          className={`${btn} ${editor.isActive('bold') ? active : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('italic') ? active : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('heading', { level: 2 }) ? active : ''}`}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('bulletList') ? active : ''}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          List
        </button>
        <button
          type="button"
          className={`${btn} ${editor.isActive('blockquote') ? active : ''}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            const url = window.prompt('Link URL');
            if (!url) return;
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }}
        >
          Link
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
