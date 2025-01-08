/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import {
  MinTrack,
  getAllDays,
  getDays,
  getRandomSpan,
  isFrDay,
  isWorkDay,
  readableTimeTracking,
  setupApi,
  weekday,
} from './utils';
import { prompt } from 'inquirer';

export const add = async (argv: {
  token: string;
  verbose: number;
  account: string;
  includeToday: boolean;
  taskId: number;
  pauseId: number;
  single: boolean;
  year: string;
}) => {
  const { api, me } = await setupApi(argv);

  const days = await getDays(api, me, argv);

  // generate a list of all days in the current year
  const allDays = getAllDays(argv.year);

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
