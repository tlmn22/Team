-- Багийн лого хадгалах public bucket. Upload нь зөвхөн Server Action-с
-- (service-role, canManageClub шалгасны дараа) хийгдэнэ тул storage.objects дээр
-- нэмэлт RLS policy шаардлагагүй — public:true нь унших эрхийг олгоно.
insert into storage.buckets (id, name, public)
values ('team-logos', 'team-logos', true)
on conflict (id) do nothing;
