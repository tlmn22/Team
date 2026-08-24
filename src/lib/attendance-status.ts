import type { AttendanceStatus } from '@/lib/actions/attendance';

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Ирсэн',
  absent: 'Тасалсан',
  late: 'Хоцорсон',
  excused: 'Чөлөөтэй',
};

export const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  late: 'bg-yellow-100 text-yellow-700',
  excused: 'bg-gray-100 text-gray-600',
};
