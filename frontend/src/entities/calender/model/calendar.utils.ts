import { CalendarCell } from './calendar.types';

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
export const MONTH_LABELS = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
];

// 달력생성
export const getMonthMatrix = (year: number, month: number): CalendarCell[][] => {
  const matrix: CalendarCell[][] = [];
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  let dayCounter = 1;
  let nextMonthDay = 1;

  for (let week = 0; week < 6; week++) {
    const row: CalendarCell[] = [];
    let hasNextMonth = false;

    for (let day = 0; day < 7; day++) {
      let cell: CalendarCell;
      const cellIdx = week * 7 + day;
      if (cellIdx < firstDayOfWeek) {
        cell = {
          day: daysInPrevMonth - firstDayOfWeek + day + 1,
          date: new Date(year, month - 1, daysInPrevMonth - firstDayOfWeek + day + 1),
          muted: true,
        };
      } else if (dayCounter > daysInMonth) {
        cell = {
          day: nextMonthDay,
          date: new Date(year, month + 1, nextMonthDay),
          muted: true,
        };
        nextMonthDay++;
      } else {
        cell = {
          day: dayCounter,
          date: new Date(year, month, dayCounter),
        };
        dayCounter++;
      }
      row.push(cell);
      if (cell.muted) hasNextMonth = true;
    }
    matrix.push(row);
    if (dayCounter > daysInMonth && hasNextMonth) break;
  }
  return matrix;
};

// 날짜변경
export function toYMD(date: Date | string): string {
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

// 날짜 + 시간 변경
export function toYMDHM(date: Date | string): string {
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
