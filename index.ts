/* eslint-disable no-console */
import { prompt } from 'inquirer';
import fetch from 'node-fetch';

const holidays = ['2022-02-15'];

const nextDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay;
};

const addTime = (
  token: string,
  userId: number,
  taskId: number,
  start: string,
  end: string,
) =>
  fetch('https://go.timetac.com/imcgmbh/userapi/v3/timeTrackings/create/', {
    headers: {
      accept: 'application/json',
      'accept-language': 'de-DE,de;q=0.9,en;q=0.8,en-US;q=0.7',
      authorization: `Bearer ${token}`,
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      pragma: 'no-cache',
      'sec-ch-ua':
        '"Google Chrome";v="87", " Not;A Brand";v="99", "Chromium";v="87"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'tt-analytics-action': 'create',
      'tt-analytics-description': 'window',
      'tt-analytics-endpoint': 'timetrackings',
      'tt-analytics-grid': 'calendar',
      'x-requested-with': 'XMLHttpRequest',
    },
    body: `{"0":{"user_id":${userId},"task_id":${taskId},"start_time_timezone":"Europe/Vienna","end_time_timezone":"Europe/Vienna","start_time":"${start}","end_time":"${end}","notes":"","start_type_id":"0","end_type_id":"0"}}`,
    method: 'POST',
  });

const main = async () => {
  const {
    start,
    end,
    taskId,
    userId,
    token,
  }: {
    start: string;
    end: string;
    taskId: number;
    userId: number;
    token: string;
  } = await prompt([
    {
      type: 'number',
      name: 'userId',
      message: 'User id:',
      default: 56,
    },
    {
      type: 'number',
      name: 'taskId',
      message: 'Task id:',
      default: 179, // HOMEOFFICE
    },
    {
      type: 'input',
      name: 'token',
      message: 'Token:',
      default: '12345678123456781234567812345678',
    },
    {
      type: 'input',
      name: 'start',
      message: 'Start date:',
      default: new Date().toISOString().slice(0, 10),
    },
    {
      type: 'input',
      name: 'end',
      message: 'End date:',
      default: new Date().toISOString().slice(0, 10),
    },
  ]);
  const pauseId = 9;
  const startDate = new Date(start);
  const endDate = new Date(end);
  let currentDate = startDate;
  do {
    const isoDay = currentDate.toISOString().slice(0, 10);
    if (
      currentDate.getDay() > 0 &&
      currentDate.getDay() < 6 &&
      holidays.indexOf(isoDay) < 0
    ) {
      console.log(`adding ${isoDay}`);
      const start = 7.5 * 60 + Math.round(Math.random() * 30); // 7:50 + 0-30 min
      const startH = Math.floor(start / 60);
      const startM = start - startH * 60;

      // eslint-disable-next-line prettier/prettier
      const startDateTime = `${isoDay} ${`${startH}`.padStart(2, '0')}:${`${startM}`.padStart(2, '0')}:00`;

      const end = start + 8.75 * 60;
      const endH = Math.floor(end / 60);
      const endM = end - endH * 60;

      // eslint-disable-next-line prettier/prettier
      const endDateTime = `${isoDay} ${`${endH}`.padStart(2, '0')}:${`${endM}`.padStart(2, '0')}:00`;

      if (currentDate.getDay() < 5) {
        await addTime(
          token,
          userId,
          taskId,
          startDateTime,
          `${isoDay} 12:00:00`,
        );
        await addTime(
          token,
          userId,
          pauseId,
          `${isoDay} 12:00:00`,
          `${isoDay} 12:30:00`,
        );
        await addTime(token, userId, taskId, `${isoDay} 12:30:00`, endDateTime);
      } else {
        await addTime(
          token,
          userId,
          taskId,
          `${isoDay} 08:00:00`,
          `${isoDay} 13:30:00`,
        );
      }
    }
    currentDate = nextDay(currentDate);
  } while (currentDate < endDate);
};

main().catch((e) => console.error(e));
