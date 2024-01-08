// This core does steps:
// 0. Deploy a mock ERC-20 token
// 1. Deploy platform fee
// 2. Deploy a DAO factory
// 3. Create a new DAO using DAOFactory
// 4. Fund DAO treasury
// 5. Create a new job
// 6. Apply job, the user becomes a candidate
// 7. Accept candidate, user become a DAO member with a contract
// 8. Create a project by project manager
// 9. Create a new task and assign to dev
// 10. Change task status to completes (By code reviewer)
// 11. Pay dev by a treasury manager

import { provider } from "@/utils/network";
import { Contract, TypedContract, num, shortString, cairo, AccountInterface } from "starknet";
import { DAO_FACTORY } from "./config";
import { convertToString, convertToTextStruct } from "@/utils/cairotext";

let daoFactoryContractTyped: TypedContract<typeof DAO_FACTORY.abi>;
if (!daoFactoryContractTyped) {
    let daoFactoryContract = new Contract(DAO_FACTORY.abi, DAO_FACTORY.address || "", provider);
    daoFactoryContractTyped = daoFactoryContract.typed(DAO_FACTORY.abi);
}

export const getDAOs = async () => {
    let allDAOs: Array<bigint> = await daoFactoryContractTyped.get_all_daos();
    console.log(allDAOs.map(dao => num.toHexString(dao)));

}

export const createDAO = async (account: AccountInterface | undefined) => {
    
    let daoDetail = {
        name: convertToTextStruct("A2Z company"),
        short_description: convertToTextStruct("We are a w3b startup seeking for talent developers"),
        detail: convertToTextStruct("https://starlancer.a2n.finance"),
        social_networks: convertToTextStruct("https://twitter.com/levi_a2n")
    }

    let treasuryManagers = ["0x021CE1d9bf39d475a4Bb4b407Db0f41D36188f67E152B576D67340DC181167E3"];
    let memberManagers = ["0x021CE1d9bf39d475a4Bb4b407Db0f41D36188f67E152B576D67340DC181167E3"];
    let projectManagers = ["0x02b3614ae7F63AAdedA321a95da44C6E8bD3D81ddA535a7C29E535A8A9e17Ab3"];
    let jobManagers = ["0x02b3614ae7F63AAdedA321a95da44C6E8bD3D81ddA535a7C29E535A8A9e17Ab3"];
    
    let myCallData = daoFactoryContractTyped.populate("create_dao",
        [
            daoDetail,
            treasuryManagers,
            memberManagers,
            projectManagers,
            jobManagers
        ]
    )

    daoFactoryContractTyped.connect(account);

    await daoFactoryContractTyped.create_dao(
        myCallData.calldata
    )
}

export const fundDAO = async () => {

}

export const createJob = async () => {

}

export const applyJob = async () => {

}

export const acceptCandidate = async () => {

}

export const createProject = async () => {

}

export const newTask = async () => {

}

export const changeTaskStatus = async () => {

}

export const payDev = async () => {

}


