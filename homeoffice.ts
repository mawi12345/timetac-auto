/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import { TimeTracking } from '@timetac/js-client-library';
import { getDays, readableTimeTracking, setupApi, weekday } from './utils';
import { prompt } from 'inquirer';

export const homeoffice = async (argv: {
  token: string;
  verbose: number;
  account: string;
  single: boolean;
  days: number;
  homeofficeId: number;
  taskId: number;
  pauseId: number;
}) => {
  const { api, me } = await setupApi(argv);

  const days = await getDays(api, me, argv);

  const existingHomeofficeDaysTracks: {
    [key: string]: TimeTracking[];
  } = {};

  for (const day of Object.keys(days)) {
    const homeofficeTracks = days[day].filter(
      (tt) => tt.task_id === argv.homeofficeId,
    );
    if (homeofficeTracks.length > 0) {
      existingHomeofficeDaysTracks[day] = days[day];
    }
  }

  const exitingHomeOfficeDays = Object.keys(existingHomeofficeDaysTracks);

  console.log(`Found ${exitingHomeOfficeDays.length} homeoffice days`);

  if (exitingHomeOfficeDays.length >= argv.days) {
    return 0;
  }

  const canditatesToConvert = Object.keys(days).filter(
    (day) =>
      !exitingHomeOfficeDays.includes(day) &&
      days[day].every(
        (tt) => tt.task_id === argv.taskId || tt.task_id === argv.pauseId,
      ),
  );

  console.log(`Found ${canditatesToConvert.length} canditate days to convert`);

  const missingDays = argv.days - exitingHomeOfficeDays.length;

  if (canditatesToConvert.length < missingDays) {
    throw new Error(`Not enough canditates to convert`);
  }

  // Shuffle array
  const shuffled = canditatesToConvert.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, missingDays).sort();

  if (argv.verbose) console.log(`Converting days:\n  ${selected.join('\n  ')}`);

  if (
    !(
      await prompt({
        name: 'confirm',
        message: `Convert ${selected.length} days?`,
        type: 'confirm',
        default: false,
      })
    ).confirm
  ) {
    return -1;
  }

  for (const date of selected) {
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
    for (const tt of days[date]) {
      if (tt.task_id === argv.taskId) {
        const { Results } = await api.timeTrackings.update({
          id: tt.id,
          task_id: argv.homeofficeId,
        });
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 1000),
        );
        console.log(`✅   ${readableTimeTracking(Results)}`);
      } else {
        console.log(`✅   ${readableTimeTracking(tt)}`);
      }
    }
  }
};
