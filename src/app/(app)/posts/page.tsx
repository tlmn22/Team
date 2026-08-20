import { requireUser, getCurrentTeamId, getMyTeams } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import NoTeamSelected from '@/components/NoTeamSelected';
import { IconPosts } from '@/components/icons';

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Мэдээ</h1>

      {(posts ?? []).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-gray-400 text-sm text-center py-8">Пост алга</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts ?? []).map((p) => (
            <article key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <IconPosts className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-gray-900 truncate">{p.title}</h2>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0">
                      {TYPE_LABEL[p.type] ?? p.type}
                    </span>
                  </div>
                  {p.content && (
                    <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{p.content}</p>
                  )}
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
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(p.created_at).toLocaleDateString('mn-MN')}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
