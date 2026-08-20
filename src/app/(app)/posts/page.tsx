import { requireUser, getCurrentTeamId, getMyTeams } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NoTeamSelected from '@/components/NoTeamSelected';

const TYPE_LABEL: Record<string, string> = {
  news: 'Мэдээ',
  video: 'Видео',
  file: 'Файл',
  scout: 'Скаут',
};

export default async function PostsPage() {
  await requireUser();
  const teamId = await getCurrentTeamId();

  if (!teamId) {
    const teams = await getMyTeams();
    return <NoTeamSelected teams={teams} />;
  }

  const admin = createAdminClient();
  const { data: posts } = await admin
    .from('posts')
    .select('id, title, content, type, file_url, file_name, video_url, created_at')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Мэдээ</h1>

      {(posts ?? []).length === 0 && <p className="text-sm text-slate-400">Пост алга</p>}

      <div className="space-y-4">
        {(posts ?? []).map((p) => (
          <article key={p.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">{p.title}</h2>
              <span className="text-xs text-slate-400">{TYPE_LABEL[p.type] ?? p.type}</span>
            </div>
            {p.content && <p className="text-sm text-slate-600 whitespace-pre-line">{p.content}</p>}
            {p.video_url && (
              <a
                href={p.video_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-orange-600 hover:underline mt-1 inline-block"
              >
                Видео үзэх ↗
              </a>
            )}
            {p.file_url && (
              <a
                href={p.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-orange-600 hover:underline mt-1 inline-block"
              >
                {p.file_name ?? 'Файл татах'} ↗
              </a>
            )}
            <div className="text-xs text-slate-400 mt-2">
              {new Date(p.created_at).toLocaleDateString('mn-MN')}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
