/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion, @typescript-eslint/naming-convention */
import { RequestParamsBuilder, TimeTracking } from '@timetac/js-client-library';
import { readableTimeTracking, setupApi } from './utils';
import { prompt } from 'inquirer';

export const approve = async (argv: {
  token: string;
  verbose: number;
  account: string;
  single: boolean;
  count: number;
}) => {
  const { api, me } = await setupApi(argv);

  const res = await api.timeTrackings.read(
    new RequestParamsBuilder<TimeTracking>()
      .limit(1000)
      .orderBy('id', 'desc')
      .build(),
  );
  const Results = res.Results;

  console.log(`Found ${Results.length} unapproved time trackings`);

  console.log(Results);
};
