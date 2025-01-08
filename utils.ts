/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import Api, {
  RequestParamsBuilder,
  TimeTracking,
  UserReadMe,
} from '@timetac/js-client-library';

export const weekday = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

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

export const getAllDays = (year: string) => {
  const allDays: string[] = [];
  const currentDate = new Date(`${year}-01-01`);
  while (
    currentDate.toISOString().slice(0, 10) !==
    new Date().toISOString().slice(0, 10)
  ) {
    // next day
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    allDays.push(currentDate.toISOString().slice(0, 10));
  }
  return allDays;
};

export const setupApi = async (argv: {
  token: string;
  verbose: number;
  account: string;
}) => {
  const user = JSON.parse(
    Buffer.from(argv.token.split('.')[1], 'base64').toString(),
  );

  const tokenLifetime = user.exp - Math.round(Date.now() / 1000);

  // let the token expire 5 minutes before it actually does
  // so we don't have to deal with token refresh
  if (tokenLifetime < 5 * 60) {
    throw new Error(`Token expired ${Math.round(tokenLifetime / -60)}min ago`);
  }

  if (argv.verbose > 1) {
    console.log(
      `Logged in with token ${JSON.stringify(
        user,
        null,
        2,
      )} for next ${tokenLifetime} seconds`,
    );
  } else if (argv.verbose) {
    console.log(
      `Logged in with "${user.sub}" for the next ${Math.round(
        tokenLifetime / 60,
      )}min`,
    );
  }

  const api = new Api({
    account: argv.account,
    accessToken: argv.token,
  });

  const meRes = await api.users.readMe();
  const me = meRes.Results;

  if (argv.verbose > 1)
    console.log(`Logged in with user ${JSON.stringify(me, null, 2)}`);

  return { api, me };
};

export const getDays = async (
  api: Api,
  me: UserReadMe,
  argv: { verbose: number; year: string },
) => {
  const res = await api.timeTrackings.read(
    new RequestParamsBuilder<TimeTracking>()
      .limit(1000)
      .eq('user_id', me.id)
      .orderBy('id', 'desc')
      .build(),
  );
  const Results = res.Results;

  if (argv.verbose > 1)
    console.log(`Logged in with user ${JSON.stringify(me, null, 2)}`);

  // group by day and only keep current year
  const days: { [key: string]: TimeTracking[] } = {};
  for (const tt of Results) {
    const date = tt.start_time!.slice(0, 10);
    if (!date.startsWith(argv.year)) {
      continue;
    }
    if (!days[date]) {
      days[date] = [];
    }
    days[date].push(tt);
  }
  for (const d of Object.values(days)) {
    d.sort((a, b) => a.start_time!.localeCompare(b.start_time!));
  }

  // print the whole year
  const daysSorted = Object.keys(days).sort();
  if (argv.verbose > 1) {
    for (const date of daysSorted) {
      console.log(`\n${date} [${weekday[new Date(date).getDay()]}]`);
      console.log(`  ${days[date].map(readableTimeTracking).join('\n  ')}`);
    }
  }

  return days;
};
