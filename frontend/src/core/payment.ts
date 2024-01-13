import { Stream } from "@/controller/stream/streamSlice";
import { AccountInterface, CallData, cairo } from "starknet";
import { WHITELISTED_TOKENS } from "./config";
import { provider } from "@/utils/network";
import { store } from "@/controller/store";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
export const doBatch = async (formValues: FormData, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
      
        store.dispatch(updateActionStatus({ actionName: actionNames.createBatchPaymentAction, value: true }));
        let recipients: {address: string, amount: number}[] = formValues["recipients"];
        let token_address = formValues["token_address"];
        let callCommands = recipients.map(r => {
            return {
                contractAddress: token_address,
                entrypoint: "transfer",
                // approve 1 wei for bridge
                calldata: CallData.compile({
                    recipient: r.address,
                    amount: cairo.uint256(BigInt(r.amount * 10**WHITELISTED_TOKENS[token_address].decimals)),
                  })
                }
        })

        console.log(callCommands);
        const multiCall = await account.execute(callCommands)
        await provider.waitForTransaction(multiCall.transaction_hash);
        openNotification("Batch Transfer", `A batch transfer was created successful!`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Batch Transfer", `Fail to create a batch transfer`, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.createBatchPaymentAction, value: false }));
}

export const createStream = async (formValues: FormData, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}


export const cancelStream = async (formValues: Stream, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}

export const transferStream = async (formValues: FormData, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}

export const fundStream = async (formValues: FormData, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}


export const withdrawStream = async (formValues: FormData, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}

export const getOutgoingStreams = async (account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}


export const getIncomingStreams = async (account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }
}
