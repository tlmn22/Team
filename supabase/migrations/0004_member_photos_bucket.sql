-- Гишүүний (тоглогч/дасгалжуулагч) зураг хадгалах public bucket. Upload нь
-- зөвхөн Server Action-с (service-role, canManageTeam шалгасны дараа) хийгдэнэ
-- тул storage.objects дээр нэмэлт RLS policy шаардлагагүй.
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do nothing;
