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
import { Contract, TypedContract, num, shortString, cairo, AccountInterface, CairoCustomEnum } from "starknet";
import { DAO, DAO_FACTORY } from "./config";
import { convertToString, convertToTextStruct } from "@/utils/cairotext";
import { convertDAOData, convertJobData, convertProjectData } from "@/helpers/data_converter";
import { store } from "@/controller/store";

import { setDAOProps } from "@/controller/dao/daoSlice";
import { setDAODetail, setDAOStatistics, setJobs, setProjects, setUserRoles } from "@/controller/dao/daoDetailSlice";
import moment from "moment";
let daoContract: Contract;
let daoContractTyped: TypedContract<typeof DAO.abi>;
let daoFactoryContractTyped: TypedContract<typeof DAO_FACTORY.abi>;

if (!daoFactoryContractTyped) {
    let daoFactoryContract = new Contract(DAO_FACTORY.abi, DAO_FACTORY.address || "", provider);
    daoFactoryContractTyped = daoFactoryContract.typed(DAO_FACTORY.abi);
}

const singletonDAOContract = (daoAddress: string | "") => {
    if (daoAddress) {
        if (!daoContract || daoContract.address !== daoAddress) {
            daoContract = new Contract(DAO.abi, daoAddress, provider);
            daoContractTyped = daoContract.typed(DAO.abi);
        }
    }
}
export const getDAOs = async () => {
    try {
        let allDAOs: Array<bigint> = await daoFactoryContractTyped.get_all_daos();
        let addresses = allDAOs.map(dao => num.toHexString(dao));

        let reqList: any = [];
        for (let i = 0; i < allDAOs.length; i++) {
            let contract = new Contract(DAO.abi, addresses[i] || "", provider);
            reqList.push(contract.get_dao_detail())
        }

        let daoDetails = await Promise.all(reqList);

        let daos = daoDetails.map((detail, index) => convertDAOData({ ...detail, address: addresses[index] }));
        store.dispatch(setDAOProps({ att: "daos", value: daos }))
        store.dispatch(setDAOProps({ att: "isLoadingDAOs", value: false }))
    } catch (e) {
        console.log(e);
    }


}

export const getDAODetail = async (address: string) => {
    try {
        singletonDAOContract(address);
        let detail = await daoContractTyped.get_dao_detail();
        store.dispatch(setDAODetail(convertDAOData({ ...detail, address: address })))

    } catch (e) {
        console.log(e);
    }

}

export const getDAOStatistics = async (address: string) => {
    try {
        singletonDAOContract(address);
        let statistics = await daoContractTyped.get_statistic();
        store.dispatch(setDAOStatistics(statistics))

    } catch (e) {
        console.log(e);
    }

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

export const createJob = async (address: string, account: AccountInterface | undefined) => {

    try {
        if (!address || !account) {
            // notification here
            return;
        }
        singletonDAOContract(address);

        let job = {
            creator: account.address,
            start_date: moment().unix(),
            end_date: moment().unix() + 60*60 * 24 * 30,
            title: convertToTextStruct("Cairo Developer"),
            short_description: convertToTextStruct("Develop smart contracts using cairo 1.0"),
            job_detail: convertToTextStruct("https://starlancer.a2n.finance/jobs/cairo1"),
            // true: open, false: closed,
            job_type: new CairoCustomEnum({HOURY: true}),
            fixed_price: 0,
            hourly_rate: 20 * 10**18,
            pay_by_token: process.env.NEXT_PUBLIC_STARLANCER_TOKEN,
            status: true
        };
        let myCallData = daoContractTyped.populate("add_job",
            [
                job
            ]
        )

        daoContractTyped.connect(account);
 
        await daoContractTyped.add_job(myCallData.calldata);


    } catch (e) {
        console.log(e);
    }

}
export const getJobs = async (address:string) => {
    try {
        if (!address) {
            return;
        }
        singletonDAOContract(address);
        let jobs = await daoContractTyped.get_jobs(0, 0, 10);
        let converedJobs = jobs.map(job => convertJobData(job));
        store.dispatch(setJobs(converedJobs))
    } catch (e) {
        console.log(e)
    }
}
export const applyJob = async () => {
       
}

export const acceptCandidate = async () => {

}


export const getDAOProjects =async (address: string) => {
    try {
        singletonDAOContract(address);
        let projects = await daoContractTyped.get_projects();
        let converedProjects = projects.map(p => convertProjectData(p));
        store.dispatch(setProjects(converedProjects))
    } catch(e) {
        console.log(e);
    }
}
export const createProject = async (address: string, account: AccountInterface | undefined) => {
    try {
        if (!account) {
            // notification here
            return;
        }
        singletonDAOContract(address);

        let project = {
            creator: account?.address,
            start_date: moment().unix(),
            end_date: moment().unix() + 30 * 24 * 60 * 60,
            title: convertToTextStruct("Starlancer"),
            short_description: convertToTextStruct("Initial starlancer project"),
            project_detail: convertToTextStruct("https://starlancer.a2n.finance"),
            // true: active, false: closed
            status: true
        };
        let myCallData = daoContractTyped.populate("create_project",
            [
                ["0x02b3614ae7F63AAdedA321a95da44C6E8bD3D81ddA535a7C29E535A8A9e17Ab3"],
                ["0x02b3614ae7F63AAdedA321a95da44C6E8bD3D81ddA535a7C29E535A8A9e17Ab3"],
                project
            ]
        )

        daoContractTyped.connect(account);
 
        await daoContractTyped.create_project(myCallData.calldata);


    } catch (e) {
        console.log(e);
    }
}

export const newTask = async () => {

}

export const changeTaskStatus = async () => {

}

export const payDev = async () => {

}


export const getUserRoles =async (address: string, account: AccountInterface | undefined) => {
    try {
        if(!address || !account) {
            return;
        }
        singletonDAOContract(address);

        let userRoles = await daoContractTyped.get_member_roles(account?.address);

        store.dispatch(setUserRoles(userRoles));
    } catch(e) {
        console.log(e)
    }
    
}
