'use client';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import { ClassicEditor, Essentials, Paragraph, Bold, Italic, List, Link, Autoformat } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

export default function RichTextEditorInner({
  data,
  onChange,
  placeholder,
}: {
  data: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="rich-text-editor rounded-lg border border-gray-300 overflow-hidden">
      <CKEditor
        editor={ClassicEditor}
        data={data}
        onChange={(_, editor) => onChange(editor.getData())}
        config={{
          licenseKey: 'GPL',
          plugins: [Essentials, Paragraph, Bold, Italic, List, Link, Autoformat],
          toolbar: ['bold', 'italic', '|', 'bulletedList', 'numberedList', '|', 'link', '|', 'undo', 'redo'],
          placeholder,
        }}
      />
    </div>
  );
}
