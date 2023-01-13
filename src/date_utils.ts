import { format, isBefore, isToday, isTomorrow, isYesterday, startOfYesterday, addDays, formatDistanceToNow, isWithinInterval, endOfTomorrow, addYears, endOfToday, endOfYesterday, intervalToDuration } from "date-fns";
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


export const formatDuration = (minutesElapsed: number | undefined) => {
    //Format days, hours, minutes
    if (minutesElapsed === undefined) return '?';

    const duration = intervalToDuration({ start: 0, end: minutesElapsed * 60 * 1000 })
    if (duration.days) {
        const daysDec = (minutesElapsed / 60 / 24).toLocaleString('us-EN', {maximumFractionDigits: 1,})
        return `${daysDec}d`
    }
    else if (duration.hours) {
        const hoursDec = (minutesElapsed / 60).toLocaleString('us-EN', {maximumFractionDigits: 1,})
        return `${hoursDec}h`
    }
    else {
        const minsDec = minutesElapsed.toLocaleString('us-EN', {maximumFractionDigits: 1,})
        return `${minsDec}m`
    }
}