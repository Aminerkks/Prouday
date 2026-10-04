import { parseISO, format, isValid, addDays, addWeeks, addMonths, addYears, isSameDay } from 'date-fns';
import { CalendarEvent } from '../db/types';

/**
 * Scans plain text or HTML for date strings like 2026-10-12 or 2026/10/12
 */
export function extractDatesFromText(text: string): string[] {
  if (!text) return [];
  
  // Strip HTML tags for clean text scanning
  const clean = text.replace(/<[^>]*>/g, ' ');
  
  // Match YYYY-MM-DD or YYYY/MM/DD
  const regex = /\b(\d{4})[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    const formatted = `${year}-${month}-${day}`;
    const parsed = parseISO(formatted);
    if (isValid(parsed)) {
      matches.add(formatted);
    }
  }

  return Array.from(matches);
}

/**
 * Expands a recurring or one-off event into occurrences within a given date range [rangeStart, rangeEnd].
 */
export function getEventOccurrencesInRange(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): Array<CalendarEvent & { occurrenceDate: string }> {
  const baseStart = parseISO(event.start_time);
  if (!isValid(baseStart)) return [];

  const occurrences: Array<CalendarEvent & { occurrenceDate: string }> = [];
  const baseDateStr = format(baseStart, 'yyyy-MM-dd');

  if (event.recurrence === 'none') {
    if (baseStart >= rangeStart && baseStart <= rangeEnd) {
      occurrences.push({ ...event, occurrenceDate: baseDateStr });
    }
    return occurrences;
  }

  // Handle recurring events
  let current = baseStart;
  const maxIterations = 365; // safety bound
  let iterations = 0;

  while (current <= rangeEnd && iterations < maxIterations) {
    iterations++;
    if (current >= rangeStart && current <= rangeEnd) {
      const occurrenceDate = format(current, 'yyyy-MM-dd');
      occurrences.push({
        ...event,
        id: `${event.id}_occ_${occurrenceDate}`,
        occurrenceDate
      });
    }

    switch (event.recurrence) {
      case 'daily':
        current = addDays(current, 1);
        break;
      case 'weekly':
        current = addWeeks(current, 1);
        break;
      case 'monthly':
        current = addMonths(current, 1);
        break;
      case 'yearly':
        current = addYears(current, 1);
        break;
      default:
        return occurrences;
    }
  }

  return occurrences;
}
