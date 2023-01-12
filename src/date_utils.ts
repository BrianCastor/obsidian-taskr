import { format, isBefore, isToday, isTomorrow, isYesterday, startOfYesterday, addDays, formatDistanceToNow, isWithinInterval, endOfTomorrow, addYears, endOfToday, endOfYesterday } from "date-fns";
import { enUS } from "date-fns/locale";

export const formatDateRelativeToNow = (date: Date) => {
    if (isBefore(date, addDays(startOfYesterday(), -6))) return formatDistanceToNow(date, {locale: enUS, addSuffix:true})
    if (isWithinInterval(date, {start: addDays(startOfYesterday(), -6), end: addDays(endOfYesterday(), -1)})) return format(date, "'Last' eee")
    if (isYesterday(date)) return 'Yesterday';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isWithinInterval(date, {start: endOfTomorrow(), end: addDays(endOfToday(), 6)})) return format(date, "eeee")
    if (isWithinInterval(date, {start: addDays(endOfToday(), 6), end: addDays(endOfToday(), 10)})) return format(date, "'Next' eeee")
    if (isWithinInterval(date, {start: addDays(endOfToday(), 10), end: addYears(endOfToday(), 1)})) return format(date, "MMM dd")
    return format(date, 'MM/dd/yy')
}