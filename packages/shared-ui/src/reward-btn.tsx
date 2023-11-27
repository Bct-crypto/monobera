"use client";

import { useState } from "react";
import {
  REWARDS_PRECOMPILE_ABI,
  TransactionActionType,
  useBeraJs,
  usePollBgtRewards,
} from "@bera/berajs";
import { bgtTokenAddress, rewardsAddress } from "@bera/config";
import { Button } from "@bera/ui/button";
import { Dialog, DialogContent } from "@bera/ui/dialog";
import { Input } from "@bera/ui/input";
import { parseEther } from "viem";
import { type Address } from "wagmi";

import { ActionButton } from "./action-btn-wrapper";
import { useTxn } from "./hooks";
import { TokenIcon } from "./token-icon";

export function RewardBtn({ poolAddress, ...props }: any) {
  const { isReady } = useBeraJs();

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<`${number}` | "max" | undefined>(
    undefined,
  );

  const { useBgtReward, refetch } = usePollBgtRewards([poolAddress]);
  const { data: bgtRewards } = useBgtReward(poolAddress);

  const { write, isLoading, ModalPortal } = useTxn({
    message: `Claiming ${
      amount === "max" ? "All" : Number(amount).toFixed(2)
    } BGT Rewards`,
    actionType: TransactionActionType.CLAIMING_REWARDS,
    onSuccess: () => refetch(),
  });

  return (
    <>
      {ModalPortal}
      <Button
        {...props}
        disabled={isLoading || Number(bgtRewards) === 0 || !isReady}
        onClick={() => setOpen(true)}
      >
        Claim
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-4">
          <RewardModalContent
            {...{ poolAddress, amount, setAmount, write, bgtRewards }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

const RewardModalContent = ({
  poolAddress,
  amount,
  setAmount,
  write,
  bgtRewards,
}: {
  poolAddress: Address;
  amount: `${number}` | "max" | undefined;
  setAmount: (amount: `${number}` | "max" | undefined) => void;
  write: (arg0: any) => void;
  bgtRewards: string | undefined;
}) => {
  const exceeding =
    amount !== "max" &&
    amount !== undefined &&
    Number(amount) > Number(bgtRewards);
  return (
    <div className="flex w-full flex-col gap-8 ">
      <div className="text-lg font-semibold leading-7">Unclaimed Rewards</div>
      <div>
        <Input
          className="w-full text-right"
          placeholder="0.00"
          startAdornment={
            <div className="flex gap-2 text-muted-foreground">
              {" "}
              <TokenIcon address={bgtTokenAddress} fetch /> BGT
            </div>
          }
          value={amount === "max" ? bgtRewards : amount}
          type="number"
          onChange={(e: any) =>
            setAmount(e.target.value as `${number}` | "max" | undefined)
          }
        />
        <div className="mt-1 h-[10px] text-right text-[10px] text-muted-foreground">
          {" "}
          Available to Claim: {Number(bgtRewards).toFixed(2)}{" "}
          <span
            className=" cursor-pointer underline"
            onClick={() => setAmount("max")}
          >
            MAX
          </span>
        </div>
      </div>
      <ActionButton>
        <Button
          className="w-full"
          disabled={amount === `${0}` || !amount || exceeding}
          onClick={() => {
            write(
              amount === "max"
                ? {
                    address: rewardsAddress,
                    abi: REWARDS_PRECOMPILE_ABI,
                    functionName: "withdrawAllDepositorRewards",
                    params: [poolAddress],
                  }
                : {
                    address: rewardsAddress,
                    abi: REWARDS_PRECOMPILE_ABI,
                    functionName: "withdrawDepositorRewards",
                    params: [poolAddress, parseEther(amount ?? "0")],
                  },
            );
          }}
        >
          Claim Rewards
        </Button>
      </ActionButton>
    </div>
  );
};