import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";

const ImageWithKey = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-r2-key": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-r2-key"),
        renderHTML: (attributes) => {
          if (!attributes["data-r2-key"]) return {};
          return { "data-r2-key": attributes["data-r2-key"] };
        },
      },
    };
  },
});

const starterKit = StarterKit.configure({
  heading: { levels: [1, 2, 3] },
  link: false,
  underline: false,
});

export function getBlogRenderExtensions() {
  return [
    starterKit,
    Underline,
    Link.configure({
      openOnClick: true,
      HTMLAttributes: { class: "blog-link", rel: "noopener noreferrer" },
    }),
    ImageWithKey.configure({
      HTMLAttributes: { class: "blog-inline-image" },
    }),
  ];
}

export function getBlogEditorExtensions(placeholder = "Start writing your blog post...") {
  return [
    starterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: "blog-link" },
    }),
    ImageWithKey.configure({
      HTMLAttributes: { class: "blog-inline-image" },
    }),
    Placeholder.configure({ placeholder }),
  ];
}
