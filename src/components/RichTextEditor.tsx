'use client';

import dynamic from 'next/dynamic';

const RichTextEditorInner = dynamic(() => import('./RichTextEditorInner'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
      Ачаалж байна...
    </div>
  ),
});

export default function RichTextEditor(props: {
  data: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  return <RichTextEditorInner {...props} />;
}
