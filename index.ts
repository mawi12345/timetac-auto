/* eslint-disable no-console */
import { prompt } from 'inquirer';
import fetch from 'node-fetch';

const holidays = [
  '2020-12-08',
  '2020-11-01',
  '2020-10-26',
  '2020-08-15',
  '2020-06-11',
];

const nextDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  return nextDay;
};

const addTime = (
  token: string,
  userId: number,
  taskId: number,
  start: Date,
  end: Date,
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
    body: `{"0":{"user_id":${userId},"task_id":${taskId},"start_time_timezone":"Europe/Vienna","end_time_timezone":"Europe/Vienna","start_time":"${start
      .toISOString()
      .slice(0, 10)} ${start
      .toISOString()
      .slice(11, 19)}","end_time":"${end
      .toISOString()
      .slice(0, 10)} ${end
      .toISOString()
      .slice(11, 19)}","notes":"","start_type_id":"0","end_type_id":"0"}}`,
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
      default: 176,
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
      if (currentDate.getDay() < 5) {
        await addTime(
          token,
          userId,
          taskId,
          new Date(`${isoDay} 07:30`),
          new Date(`${isoDay} 11:30`),
        );
        await addTime(
          token,
          userId,
          pauseId,
          new Date(`${isoDay} 11:30`),
          new Date(`${isoDay} 12:00`),
        );
        await addTime(
          token,
          userId,
          taskId,
          new Date(`${isoDay} 12:00`),
          new Date(`${isoDay} 16:15`),
        );
      } else {
        await addTime(
          token,
          userId,
          taskId,
          new Date(`${isoDay} 08:00`),
          new Date(`${isoDay} 13:30`),
        );
      }
    }
    currentDate = nextDay(currentDate);
  } while (currentDate < endDate);
};

main().catch((e) => console.error(e));
