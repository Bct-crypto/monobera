import useSWR from "swr";
import { type Address } from "viem";

import { indexerUrl } from "~/config";

function countTrueStatus(blocks: any): number {
  let trueCount = 0;

  for (const block of blocks) {
    if (block.status === true) {
      trueCount++;
    }
  }

  return trueCount;
}

export const useFetchValidatorUptime = (address: Address) => {
  const QUERY_KEY = ["validator-uptime", address];
  return useSWR(
    QUERY_KEY,
    async () => {
      const res = await fetch(`${indexerUrl}/validators/${address}/status`);
      const data = await res.json();
      const uptime = countTrueStatus(data.result);
      return {
        data: data.result,
        uptime: uptime,
      };
    },
    {
      refreshInterval: 5 * 60 * 1000, // 5 mins
    },
  );
};