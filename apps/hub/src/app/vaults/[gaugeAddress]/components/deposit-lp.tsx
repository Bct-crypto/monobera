import { useState } from "react";
import {
  BERA_VAULT_REWARDS_ABI,
  type Gauge,
  type Token,
  TransactionActionType,
  usePollWalletBalances,
  usePollAllowance,
  usePollVaultsInfo,
} from "@bera/berajs";
import {
  ActionButton,
  ApproveButton,
  TokenInput,
  useTxn,
} from "@bera/shared-ui";
import { Button } from "@bera/ui/button";
import BigNumber from "bignumber.js";
import { parseUnits } from "viem";

export const DepositLP = ({
  lpToken,
  gauge,
}: {
  lpToken: Token;
  gauge: Gauge;
}) => {
  const { useSelectedWalletBalance } = usePollWalletBalances({
    externalTokenList: [lpToken],
  });
  const balance = useSelectedWalletBalance(lpToken.address);
  const [depositAmount, setDepositAmount] = useState("");
  const validAmount =
    BigNumber(depositAmount).gt(0) &&
    BigNumber(depositAmount).lte(balance?.formattedBalance ?? "0");

  const { refresh } = usePollVaultsInfo({
    vaultAddress: gauge.vaultAddress,
  });

  const { write, ModalPortal } = useTxn({
    message: "Deposit LP Tokens",
    actionType: TransactionActionType.ADD_LIQUIDITY,
    onSuccess: () => {
      refresh();
    },
  });

  const { data: allowance } = usePollAllowance({
    spender: gauge.vaultAddress,
    token: lpToken,
  });

  const [exceeding, setExceeding] = useState(false);
  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div>
        <div className="text-lg font-semibold leading-7">Deposit Tokens</div>
        <div className="mt-1 text-sm leading-5">
          Deposit your tokens to start earning BGT rewards
        </div>
        <div className="mt-4 rounded-md border border-border bg-muted">
          <TokenInput
            selected={lpToken}
            amount={depositAmount}
            balance={balance?.formattedBalance}
            hidePrice
            showExceeding={true}
            selectable={false}
            setAmount={(amount: string) =>
              setDepositAmount(amount as `${number}`)
            }
            onExceeding={(exceeding) => setExceeding(exceeding)}
          />
        </div>
      </div>
      {/* <Info /> */}

      <ActionButton className="mt-4">
        {((allowance !== undefined && allowance?.formattedAllowance === "0") ||
          (allowance?.allowance ?? 0n) <
            parseUnits(depositAmount, lpToken.decimals)) &&
        depositAmount !== "" &&
        depositAmount !== "0" &&
        !exceeding ? (
          <ApproveButton
            token={lpToken}
            spender={gauge.vaultAddress}
            amount={parseUnits(depositAmount, lpToken.decimals)}
          />
        ) : (
          <Button
            className="w-full"
            disabled={!validAmount || exceeding}
            onClick={() =>
              write({
                address: gauge.vaultAddress,
                abi: BERA_VAULT_REWARDS_ABI,
                functionName: "stake",
                params: [parseUnits(depositAmount, lpToken.decimals)],
              })
            }
          >
            Deposit
          </Button>
        )}
      </ActionButton>
      {ModalPortal}
    </div>
  );
};