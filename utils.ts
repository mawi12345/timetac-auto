/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import { TimeTracking } from '@timetac/js-client-library';

export const weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const currentYear = new Date().toISOString().slice(0, 4);

export const readableTaskId = (taskId: number) => {
  if (taskId === 4) {
    return '💻'; // GK
  } else if (taskId === 9) {
    return '🍔'; // pause
  } else if (taskId === 13) {
    return '✈️'; // urlaub
  } else if (taskId === 15) {
    return '✈️'; // sonderurlaub
  } else if (taskId === 14) {
    return '❌'; // feiertag
  } else if (taskId === 17) {
    return '🚷'; // krankenstand
  } else if (taskId === 176) {
    return '💻'; // entwicklung
  } else if (taskId === 179) {
    return '🏠'; // homeoffice
  }
  return `${taskId}`;
};

export type MinTrack = {
  user_id: number;
  task_id: number;
  start_time: string;
  end_time: string;
};

export const readableTimeTracking = (tt: MinTrack | TimeTracking) => {
  return `${tt.start_time!.slice(11, 16)} - ${tt.end_time!.slice(
    11,
    16,
  )} ${readableTaskId(tt.task_id)}`;
};

export const isWorkDay = (d: string) => {
  const day = new Date(d).getDay();
  return day > 0 && day < 6;
};

export const isFrDay = (d: string) => {
  const day = new Date(d).getDay();
  return day === 5;
};

export const getRandomSpan = (duration = 8.75) => {
  const start = 7.5 * 60 + Math.round(Math.random() * 30); // 7:45 +- 15min
  const startH = Math.floor(start / 60);
  const startM = start - startH * 60;

  const startTime = `${`${startH}`.padStart(2, '0')}:${`${startM}`.padStart(
    2,
    '0',
  )}:00`;

  const end = start + duration * 60;
  const endH = Math.floor(end / 60);
  const endM = end - endH * 60;

  const endTime = `${`${endH}`.padStart(2, '0')}:${`${endM}`.padStart(
    2,
    '0',
  )}:00`;
  return { startTime, endTime };
};
