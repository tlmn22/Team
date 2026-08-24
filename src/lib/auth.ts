import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type ClubRole = 'manager' | 'owner';
export type TeamRole = 'coach' | 'player';
export type SystemRole = 'superadmin' | 'user';

export interface Profile {
  id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  system_role: SystemRole;
  photo_url: string | null;
  active: boolean;
}

export interface MyClub {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  my_role: ClubRole | 'manager';
}

export interface MyTeam {
  id: number;
  club_id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  active: boolean;
  club_name: string;
  my_role: TeamRole | 'coach';
}

/** config/auth.php: currentUser() */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, auth_user_id, name, email, phone, system_role, photo_url, active')
    .eq('auth_user_id', user.id)
    .single();

  return (profile as Profile) ?? null;
});

/** Server Action/Server Component-ийн эхэнд дуудна. config/auth.php: requireLogin()/requireApiAuth() */
export async function requireUser(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

/** config/auth.php: isSuperAdmin() */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.system_role === 'superadmin';
}

/** config/auth.php: myRoleInClub() — 'manager' | 'owner' | null. SuperAdmin -> 'manager' бүх клубд. */
export const myRoleInClub = cache(async (clubId: number): Promise<ClubRole | 'manager' | null> => {
  if (await isSuperAdmin()) return 'manager';
  const user = await getCurrentUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .maybeSingle();

  return (data?.role as ClubRole) ?? null;
});

/**
 * config/auth.php: myRoleInTeam() — 'coach' | 'player' | null.
 * SuperAdmin -> 'coach'. Клубын manager -> тухайн клубын бүх багт 'coach'.
 * Клубын owner -> тухайн клубын бүх багт 'player' (зөвхөн харах, удирдах эрхгүй).
 */
export const myRoleInTeam = cache(async (teamId: number): Promise<TeamRole | 'coach' | null> => {
  if (await isSuperAdmin()) return 'coach';
  const user = await getCurrentUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: direct } = await admin
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (direct) return direct.role as TeamRole;

  const { data: team } = await admin.from('teams').select('club_id').eq('id', teamId).maybeSingle();
  if (!team) return null;

  const { data: clubMember } = await admin
    .from('club_members')
    .select('role')
    .eq('club_id', team.club_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (clubMember?.role === 'manager') return 'coach';
  if (clubMember?.role === 'owner') return 'player';
  return null;
});

export async function canManageClub(clubId: number): Promise<boolean> {
  return (await myRoleInClub(clubId)) === 'manager';
}
export async function canViewClub(clubId: number): Promise<boolean> {
  return (await myRoleInClub(clubId)) !== null;
}
export async function canManageTeam(teamId: number): Promise<boolean> {
  return (await myRoleInTeam(teamId)) === 'coach';
}
export async function canViewTeam(teamId: number): Promise<boolean> {
  return (await myRoleInTeam(teamId)) !== null;
}

/** config/auth.php: getMyClubs() */
export const getMyClubs = cache(async (): Promise<MyClub[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const admin = createAdminClient();

  if (await isSuperAdmin()) {
    const { data } = await admin
      .from('clubs')
      .select('id, name, description, logo_url, active')
      .eq('active', true)
      .order('name');
    return (data ?? []).map((c) => ({ ...c, my_role: 'manager' as const }));
  }

  const { data } = await admin
    .from('club_members')
    .select('role, clubs!inner(id, name, description, logo_url, active)')
    .eq('user_id', user.id)
    .eq('clubs.active', true);

  return (data ?? []).map((row) => {
    const club = row.clubs as unknown as {
      id: number;
      name: string;
      description: string | null;
      logo_url: string | null;
      active: boolean;
    };
    return { ...club, my_role: row.role as ClubRole };
  });
});

/** config/auth.php: getMyTeams() */
export const getMyTeams = cache(async (): Promise<MyTeam[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const admin = createAdminClient();

  if (await isSuperAdmin()) {
    const { data } = await admin
      .from('teams')
      .select('id, club_id, name, description, logo_url, active, clubs!inner(name, active)')
      .eq('active', true)
      .eq('clubs.active', true)
      .order('name');
    return (data ?? []).map((t) => {
      const club = t.clubs as unknown as { name: string };
      return { ...t, club_name: club.name, my_role: 'coach' as const };
    });
  }

  const { data: direct } = await admin
    .from('team_members')
    .select('role, teams!inner(id, club_id, name, description, logo_url, active, clubs!inner(name))')
    .eq('user_id', user.id)
    .eq('active', true)
    .eq('teams.active', true);

  const directTeams: MyTeam[] = (direct ?? []).map((row) => {
    const t = row.teams as unknown as {
      id: number;
      club_id: number;
      name: string;
      description: string | null;
      logo_url: string | null;
      active: boolean;
      clubs: { name: string };
    };
    return { ...t, club_name: t.clubs.name, my_role: row.role as TeamRole };
  });
  const directIds = new Set(directTeams.map((t) => t.id));

  const { data: managed } = await admin
    .from('club_members')
    .select('role, club_id, clubs!inner(teams!inner(id, club_id, name, description, logo_url, active, clubs!inner(name)))')
    .eq('user_id', user.id)
    .in('role', ['manager', 'owner']);

  const managedTeams: MyTeam[] = [];
  for (const row of managed ?? []) {
    const clubData = row.clubs as unknown as {
      teams: {
        id: number;
        club_id: number;
        name: string;
        description: string | null;
        logo_url: string | null;
        active: boolean;
        clubs: { name: string };
      }[];
    };
    const myRole = row.role === 'manager' ? 'coach' : 'player';
    for (const t of clubData.teams ?? []) {
      if (!t.active || directIds.has(t.id)) continue;
      managedTeams.push({ ...t, club_name: t.clubs.name, my_role: myRole });
    }
  }

  return [...directTeams, ...managedTeams];
});

const CTX_TEAM_COOKIE = 'ctx_team_id';

/** config/auth.php: getCurrentTeamId() */
export const getCurrentTeamId = cache(async (): Promise<number | null> => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(CTX_TEAM_COOKIE)?.value;
  if (fromCookie) return Number(fromCookie);

  const teams = await getMyTeams();
  const role = await getPrimaryRole();
  if (teams.length === 1 || role === 'player') {
    if (teams.length > 0) return teams[0].id;
  }
  return null;
});

/** config/auth.php: setCurrentTeamId() — Server Action-с дуудна */
export async function setCurrentTeamId(teamId: number | null): Promise<void> {
  const cookieStore = await cookies();
  if (teamId === null) cookieStore.delete(CTX_TEAM_COOKIE);
  else cookieStore.set(CTX_TEAM_COOKIE, String(teamId), { httpOnly: true, sameSite: 'lax' });
}

/** config/auth.php: getPrimaryRole() */
export const getPrimaryRole = cache(async (): Promise<SystemRole | ClubRole | TeamRole> => {
  const user = await getCurrentUser();
  if (!user) return 'user';
  if (user.system_role === 'superadmin') return 'superadmin';

  const admin = createAdminClient();
  const { data: cm } = await admin
    .from('club_members')
    .select('role')
    .eq('user_id', user.id)
    .order('role') // 'manager' < 'owner' алфавитаар, PHP-ийн FIELD() эрэмбийг ойролцоогоор тольдоно
    .limit(1)
    .maybeSingle();
  if (cm) return cm.role as ClubRole;

  const { data: tm } = await admin
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .order('role')
    .limit(1)
    .maybeSingle();
  return (tm?.role as TeamRole) ?? 'user';
});
