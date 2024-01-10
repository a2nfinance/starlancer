import moment from "moment";
import { Contract, TypedContract } from "starknet";
import { PLATFORM } from "./config";
import { provider } from "@/utils/network";
import { store } from "@/controller/store";
import { setProps } from "@/controller/fee/platformFeeSlice";
let feeContract: Contract;
let feeContractTyped: TypedContract<typeof PLATFORM.abi>;

if (!feeContractTyped) {
    feeContract = new Contract(PLATFORM.abi, PLATFORM.address || "", provider);
    feeContractTyped = feeContract.typed(PLATFORM.abi);
}

export const getRateFee = async () => {
    let rateFee = await feeContractTyped.get_rate_fee(0);
    store.dispatch(setProps(rateFee));
}
