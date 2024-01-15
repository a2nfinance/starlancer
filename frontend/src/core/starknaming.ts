import moment from "moment";
import { Contract, TypedContract } from "starknet";
import { STARK_NAMING } from "./config";
import { provider } from "@/utils/network";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
let namingContract: Contract;
let namingContractTyped: TypedContract<typeof STARK_NAMING.abi>;

if (!namingContractTyped) {
    namingContract = new Contract(STARK_NAMING.abi, STARK_NAMING.address || "", provider);
    namingContractTyped = namingContract.typed(STARK_NAMING.abi);
}

export const getDomainByAddress = async (address: string) => {
    try {
        let naming = await namingContractTyped.address_to_domain(address);
        openNotification("StarknetID lookup", `Starknet ID Found: ${naming}`, MESSAGE_TYPE.SUCCESS, () => { });
    } catch (e) {
        console.log(e);
        openNotification("StarknetID lookup", `Could not found an ID for the address`, MESSAGE_TYPE.ERROR, () => { });
    }
   

}
