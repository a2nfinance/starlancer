import { Stream } from "@/controller/stream/streamSlice";
import { AccountInterface } from "starknet";

export const doBatch = async (formValues: FormData, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
    } catch (e) {
        console.log(e)
    }

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