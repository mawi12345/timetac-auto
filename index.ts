/* eslint-disable no-console */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { add } from './add';
import { homeoffice } from './homeoffice';

yargs(hideBin(process.argv))
  .env('TA')
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
    single: {
      type: 'boolean',
      default: false,
      description: 'ask for modification',
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
  })
  .command(
    'add',
    'add missing days',
    (s) =>
      s.options({
        includeToday: {
          type: 'boolean',
          default: false,
          description: 'Include today in missing days',
        },
      }),
    (argv) => {
      add(argv).catch((err) => {
        console.error(err);
      });
    },
  )
  .command(
    'homeoffice <days>',
    'convert days to homeoffice',
    (s) =>
      s
        .options({
          homeofficeId: {
            type: 'number',
            default: 179, // homeoffice
            description: 'Task ID for homeoffice',
          },
        })
        .positional('days', {
          type: 'number',
          description: 'number of homeoffice days',
          default: 0,
        }),
    (argv) => {
      homeoffice(argv).catch((err) => {
        console.error(err);
      });
    },
  )
  .parse();
