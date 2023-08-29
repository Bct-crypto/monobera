import useSWRInfinite from "swr/infinite";
import { usePublicClient, type Address } from "wagmi";

import { GOVERNANCE_PRECOMPILE_ABI } from "~/config";
import { useBeraConfig } from "~/contexts";
import { type PageRequest } from "~/utils";

const DEFAULT_SIZE = 10;
export const useInfiniteProposalVotes = (proposalId: number | undefined) => {
  const publicClient = usePublicClient();
  const { networkConfig } = useBeraConfig();

  const {
    data: allData,
    size: allDataSize,
    setSize: setAllDataSize,
    isLoading: isAllDataLoading,
  } = useSWRInfinite(
    (index) => ["getProposalVotes", proposalId, index],
    async (key: any[]) => {
      const page = key[2] + 1;
      const pagination: PageRequest = {
        key: "",
        offset: page * DEFAULT_SIZE,
        limit: 0,
        countTotal: true,
        reverse: false,
      };
      const result = (await publicClient
        .readContract({
          address: networkConfig.precompileAddresses
            .governanceAddress as Address,
          abi: GOVERNANCE_PRECOMPILE_ABI,
          functionName: "getProposalVotes",
          args: [proposalId, pagination],
        })
        .catch(() => {
          return undefined;
        })) as any[];
      return result[0];
    },
  );

  const isAllDataLoadingMore =
    isAllDataLoading ||
    (allDataSize > 0 &&
      allData &&
      typeof allData[allDataSize - 1] === "undefined");

  const isAllDataEmpty = allData?.[0]?.length === 0;

  const isAllDataReachingEnd =
    isAllDataEmpty ||
    (allData && allData[allData.length - 1]?.length < DEFAULT_SIZE);

  const data = (allData ? [].concat(...allData) : []) as any[];

  return {
    data,
    size: allDataSize,
    isLoading: isAllDataLoadingMore,
    isReachingEnd: isAllDataReachingEnd,
    setSize: setAllDataSize,
  };
};