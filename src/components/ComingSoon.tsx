export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm text-gray-500">
          Энэ хуудас Phase 2-т (CRUD үйлдэл) хийгдэнэ — одоогоор зөвхөн унших хуудсууд
          (Хуваарь, Мэдээ, Тайлан) бэлэн байна.
        </p>
      </div>
    </div>
  );
}
