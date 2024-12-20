/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import {
  ChangeTimeTrackingRequest,
  RequestParamsBuilder,
} from '@timetac/js-client-library';
import { setupApi } from './utils';
import { prompt } from 'inquirer';

// const mawi = 56;

export const approve = async (argv: {
  token: string;
  verbose: number;
  account: string;
  single: boolean;
  count: number;
}) => {
  const { api } = await setupApi(argv);

  const { Results } = await api.changeTimeTrackingsRequest.read(
    new RequestParamsBuilder<ChangeTimeTrackingRequest>()
      .limit(argv.count)
      // .eq('request_user_id', mawi)
      .eq('status', 'PENDING')
      .orderBy('id', 'desc')
      .build(),
  );

  console.log(
    `Found ${Results.length}/${argv.count} unapproved time trackings`,
  );

  if (
    !(
      await prompt({
        name: 'confirm',
        message: `Accept ${Results.length} unapproved time trackings?`,
        type: 'confirm',
        default: false,
      })
    ).confirm
  ) {
    return -1;
  }

  for (const r of Results) {
    if (argv.single) {
      if (
        !(
          await prompt({
            name: 'confirm',
            message: `Accept ${r.type} ${r.id}?`,
            type: 'confirm',
            default: false,
          })
        ).confirm
      ) {
        return -1;
      }
    } else {
      console.log(`✅   Accepting ${r.type} ${r.id}`);
    }

    await api.timeTrackings.approve({
      id: r.time_tracking_id,
      _granted_user_comment: '',
    });
  }
};
