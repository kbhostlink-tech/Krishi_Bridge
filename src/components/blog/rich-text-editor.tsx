"use client";

import { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBlogEditorExtensions } from "./editor-extensions";

type RichTextEditorProps = {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onUploadImage: (file: File) => Promise<string | { url: string; key?: string }>;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors",
        active
          ? "border-[#405742] bg-[#405742] text-white"
          : "border-[#ddd4c4] bg-white text-stone-600 hover:bg-[#f8f4ec] hover:text-stone-900",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder,
  className,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadingRef = useRef(false);

  const editor = useEditor({
    extensions: getBlogEditorExtensions(placeholder),
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none min-h-[320px] px-4 py-3 focus:outline-none [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-[#c9b98f] [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:rounded-lg",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON() as Record<string, unknown>);
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor || isUploadingRef.current) return;
      isUploadingRef.current = true;
      try {
        const result = await onUploadImage(file);
        const url = typeof result === "string" ? result : result.url;
        const key = typeof result === "string" ? undefined : result.key;
        editor
          .chain()
          .focus()
          .setImage({
            src: url,
            ...(key ? { "data-r2-key": key } : {}),
          })
          .run();
      } finally {
        isUploadingRef.current = false;
      }
    },
    [editor, onUploadImage]
  );

  if (!editor) {
    return (
      <div className={cn("rounded-xl border border-[#ddd4c4] bg-white p-4", className)}>
        <div className="h-[360px] animate-pulse rounded-lg bg-[#f5efe3]" />
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-[#ddd4c4] bg-white", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-[#ddd4c4] bg-[#faf6ee] p-2">
        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-[#ddd4c4]" />
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-[#ddd4c4]" />
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-[#ddd4c4]" />
        <ToolbarButton title="Add link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton title="Insert image" onClick={() => fileInputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-[#ddd4c4]" />
        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleImageUpload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
