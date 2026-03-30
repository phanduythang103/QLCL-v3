/**
 * Date utility for consistent filtering across the webapp.
 * Standardizes "Week" to start on Monday and end on Sunday.
 */

export type DateRangeType = 
  | 'today' | 'thisWeek' | 'lastWeek' 
  | 'thisMonth' | 'lastMonth' 
  | 'thisQuarter' | 'lastQuarter' 
  | 'thisYear' | 'lastYear' 
  | 'custom' | 'all';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Returns the Monday of the week for a given date.
 */
export const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // d.getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want: 0 -> -6, 1 -> 0, 2 -> -1, 3 -> -2, 4 -> -3, 5 -> -4, 6 -> -5
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(d.setDate(diff));
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Returns the date range for a specific type.
 */
export const getDateRange = (type: string, customStartDate?: string, customEndDate?: string): DateRange => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  // Set end to end of day by default
  end.setHours(23, 59, 59, 999);
  
  switch (type) {
    case 'today':
    case 'Hôm nay':
    case 'HOM_NAY':
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: end };

    case 'thisWeek':
    case 'Tuần này':
    case 'TUAN_NAY': {
      const monday = getMonday(now);
      return { startDate: monday, endDate: end };
    }

    case 'lastWeek':
    case 'Tuần trước':
    case 'TUAN_TRUOC': {
      const thisMonday = getMonday(now);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      
      return { startDate: lastMonday, endDate: lastSunday };
    }

    case 'thisMonth':
    case 'Tháng này':
    case 'THANG_NAY': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: firstDay, endDate: end };
    }

    case 'lastMonth':
    case 'Tháng trước':
    case 'THANG_TRUOC': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      lastDayLastMonth.setHours(23, 59, 59, 999);
      return { startDate: firstDayLastMonth, endDate: lastDayLastMonth };
    }

    case 'thisQuarter':
    case 'Quý này':
    case 'QUY_NAY': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDayQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      return { startDate: firstDayQuarter, endDate: end };
    }

    case 'lastQuarter':
    case 'Quý trước':
    case 'QUY_TRUOC': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      let year = now.getFullYear();
      let lastQuarter = currentQuarter - 1;
      if (lastQuarter < 0) {
        lastQuarter = 3;
        year -= 1;
      }
      const firstDayLastQuarter = new Date(year, lastQuarter * 3, 1);
      const lastDayLastQuarter = new Date(year, (lastQuarter + 1) * 3, 0);
      lastDayLastQuarter.setHours(23, 59, 59, 999);
      return { startDate: firstDayLastQuarter, endDate: lastDayLastQuarter };
    }

    case 'thisYear':
    case 'Năm này':
    case 'NAM_NAY': {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      return { startDate: firstDayYear, endDate: end };
    }

    case 'lastYear':
    case 'Năm trước':
    case 'NAM_TRUOC': {
      const firstDayLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const lastDayLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { startDate: firstDayLastYear, endDate: lastDayLastYear };
    }

    case 'custom':
    case 'Tùy chọn':
    case 'TUY_CHON': {
      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(customEndDate);
        e.setHours(23, 59, 59, 999);
        return { startDate: s, endDate: e };
      }
      return { startDate: null, endDate: null };
    }

    default:
      return { startDate: null, endDate: null };
  }
};

/**
 * Checks if a date string/Date is within a given range.
 */
export const isDateInRange = (dateToCheck: string | Date, range: DateRange): boolean => {
  if (!range.startDate && !range.endDate) return true;
  
  const d = typeof dateToCheck === 'string' ? new Date(dateToCheck) : dateToCheck;
  if (isNaN(d.getTime())) return false;

  if (range.startDate && d < range.startDate) return false;
  if (range.endDate && d > range.endDate) return false;
  
  return true;
};
