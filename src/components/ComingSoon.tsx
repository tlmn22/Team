export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-sm text-slate-500">
        Энэ хуудас Phase 2-т (CRUD үйлдэл) хийгдэнэ — одоогоор зөвхөн унших хуудсууд
        (Хуваарь, Мэдээ, Тайлан) бэлэн байна.
      </p>
    </div>
  );
}
