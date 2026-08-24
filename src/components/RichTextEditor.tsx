'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

function EditorLoading() {
  const t = useTranslations('common');
  return (
    <div className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
      {t('loading')}
    </div>
  );
}

const RichTextEditorInner = dynamic(() => import('./RichTextEditorInner'), {
  ssr: false,
  loading: EditorLoading,
});

export default function RichTextEditor(props: {
  data: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  return <RichTextEditorInner {...props} />;
}
