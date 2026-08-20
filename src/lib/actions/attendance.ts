'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, canManageTeam } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = (typeof STATUSES)[number];

export interface AttendanceEntry {
  userId: string;
  status: AttendanceStatus;
  notes: string | null;
}

export async function saveAttendance(
  eventId: number,
  teamId: number,
  entries: AttendanceEntry[]
): Promise<{ error?: string }> {
  await requireUser();
  if (!(await canManageTeam(teamId))) return { error: 'Энэ багийг удирдах эрхгүй байна' };
  if (entries.length === 0) return {};
  if (entries.some((e) => !STATUSES.includes(e.status))) return { error: 'Буруу төлөв' };

  const admin = createAdminClient();
  const { error } = await admin.from('event_attendance').upsert(
    entries.map((e) => ({
      event_id: eventId,
      user_id: e.userId,
      status: e.status,
      notes: e.notes,
    })),
    { onConflict: 'event_id,user_id' }
  );
  if (error) return { error: error.message };

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/reports');
  return {};
}
