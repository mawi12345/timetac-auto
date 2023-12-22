/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import Api, {
  RequestParamsBuilder,
  TimeTracking,
} from '@timetac/js-client-library';
// import fs from 'fs/promises';
// import { existsSync } from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { prompt } from 'inquirer';
import {
  MinTrack,
  currentYear,
  getAllDays,
  getRandomSpan,
  isFrDay,
  isWorkDay,
  readableTimeTracking,
  weekday,
} from './utils';

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .options({
      account: {
        alias: 'a',
        type: 'string',
        description: 'Account name',
        demandOption: true,
      },
      token: {
        alias: 't',
        type: 'string',
        description: 'token (JWT)',
        demandOption: true,
      },
      verbose: {
        alias: 'v',
        type: 'count',
        default: 0,
        description: 'Run with verbose logging',
      },
      taskId: {
        alias: 'i',
        type: 'number',
        default: 176, // entwicklung
        description: 'Task ID for work',
      },
      pauseId: {
        alias: 'p',
        type: 'number',
        default: 9, // pause
        description: 'Task ID for pause',
      },
      homeofficeId: {
        type: 'number',
        default: 179, // homeoffice
        description: 'Task ID for homeoffice',
      },
      includeToday: {
        type: 'boolean',
        default: false,
        description: 'Include today in missing days',
      },
      single: {
        type: 'boolean',
        default: false,
        description: 'ask for each day',
      },
      homeoffice: {
        type: 'number',
        default: 0,
        description: 'enusre homeoffice days',
      },
    })
    .env('TA')
    .parse();

  const user = JSON.parse(
    Buffer.from(argv.token.split('.')[1], 'base64').toString(),
  );

  const tokenLifetime = user.exp - Math.round(Date.now() / 1000);

  // let the token expire 10 minutes before it actually does
  // so we don't have to deal with token refresh
  if (tokenLifetime < 10 * 60) {
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

  // if (!existsSync('timetrackings.json')) {
  // console.log('Downloading timetrackings.json');
  const res = await api.timeTrackings.read(
    new RequestParamsBuilder<TimeTracking>()
      .limit(1000)
      .orderBy('id', 'desc')
      .build(),
  );
  const Results = res.Results;
  //   await fs.writeFile('timetrackings.json', JSON.stringify(res, null, 2));
  // }

  // if (!existsSync('user.json')) {
  //   console.log('Downloading user.json');
  const meRes = await api.users.readMe();
  const me = meRes.Results;
  //   await fs.writeFile('user.json', JSON.stringify(meRes, null, 2));
  // }

  // const tasksRes = await api.tasks.read();
  // await fs.writeFile('tasks.json', JSON.stringify(tasksRes, null, 2));

  // const { Results } = JSON.parse(
  //   await fs.readFile('timetrackings.json', 'utf-8'),
  // ) as LibraryReturn<'timeTrackings', TimeTracking[]>;

  // const me = (JSON.parse(
  //   await fs.readFile('user.json', 'utf-8'),
  // ) as LibraryReturn<'usersReadMe', UserReadMe>).Results;

  if (argv.verbose > 1)
    console.log(`Logged in with user ${JSON.stringify(me, null, 2)}`);

  // group by day and only keep current year
  const days: { [key: string]: TimeTracking[] } = {};
  for (const tt of Results) {
    const date = tt.start_time!.slice(0, 10);
    if (!date.startsWith(currentYear)) {
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

  // generate a list of all days in the current year
  const allDays = getAllDays(currentYear);

  if (!argv.includeToday) {
    allDays.pop();
  }

  // filter out all non-workdays
  const allWorkDays = allDays.filter(isWorkDay);

  // find missing days
  const missingDays = allWorkDays.filter((d) => !days[d]);

  // generate a proposal for missing days
  const proposal: { [day: string]: MinTrack[] } = {};
  for (const missingDay of missingDays) {
    if (isFrDay(missingDay)) {
      const { startTime, endTime } = getRandomSpan(5.5);
      proposal[missingDay] = [
        {
          user_id: me.id,
          task_id: argv.taskId,
          start_time: `${missingDay} ${startTime}`,
          end_time: `${missingDay} ${endTime}`,
        },
      ];
    } else {
      const { startTime, endTime } = getRandomSpan();
      proposal[missingDay] = [
        {
          user_id: me.id,
          task_id: argv.taskId,
          start_time: `${missingDay} ${startTime}`,
          end_time: `${missingDay} 12:00:00`,
        },
        {
          user_id: me.id,
          task_id: argv.pauseId,
          start_time: `${missingDay} 12:00:00`,
          end_time: `${missingDay} 12:30:00`,
        },
        {
          user_id: me.id,
          task_id: argv.taskId,
          start_time: `${missingDay} 12:30:00`,
          end_time: `${missingDay} ${endTime}`,
        },
      ];
    }
  }
  const proposalSorted = Object.keys(proposal).sort();

  // if there are missing days, ask if they should be added
  if (proposalSorted.length > 0) {
    if (argv.verbose) {
      console.log('\nMissing days:');
      for (const date of proposalSorted) {
        console.log(`\n${date} [${weekday[new Date(date).getDay()]}]`);
        console.log(
          `  ${proposal[date].map(readableTimeTracking).join('\n  ')}`,
        );
      }
    } else {
      console.log(`\nMissing days: \n  ${proposalSorted.join('\n  ')}`);
    }
    console.log();
    if (
      !(
        await prompt({
          name: 'confirm',
          message: `Add ${missingDays.length} missing days?`,
          type: 'confirm',
          default: false,
        })
      ).confirm
    ) {
      return -1;
    }

    for (const date of proposalSorted) {
      if (argv.single) {
        if (
          !(
            await prompt({
              name: 'confirm',
              message: `Add ${date} [${weekday[new Date(date).getDay()]}]`,
              type: 'confirm',
              default: false,
            })
          ).confirm
        ) {
          return -1;
        }
      } else {
        console.log(`\n➡️  ${date} [${weekday[new Date(date).getDay()]}]`);
      }
      for (const tt of proposal[date]) {
        await api.timeTrackings.create({
          ...tt,
          start_time_timezone: 'Europe/Vienna',
          end_time_timezone: 'Europe/Vienna',
          notes: '',
          start_type_id: 0,
          end_type_id: 0,
        });
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 1000),
        );
        console.log(`✅   ${readableTimeTracking(tt)}`);
      }
    }
  } else {
    console.log('No missing records found');
  }
};

main().catch((err) => {
  console.error(err);
});
