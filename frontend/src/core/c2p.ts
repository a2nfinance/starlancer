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
import { DAO, DAO_FACTORY, STARLANCER_TOKEN, WHITELISTED_TOKENS } from "./config";
import { convertToString, convertToTextStruct } from "@/utils/cairotext";
import { convertContractData, convertDAOData, convertJobData, convertProjectData, convertTaskData } from "@/helpers/data_converter";
import { store } from "@/controller/store";

import { setDAOProps } from "@/controller/dao/daoSlice";
import { setDAODetail, setDAOStatistics, setJobs, setProjects, setProps, setUserRoles } from "@/controller/dao/daoDetailSlice";
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

export const fundDAO = async (tokenAddresses: string, account: AccountInterface | undefined, amount: number, decimals: number) => {
    try {
        let { detail: dao } = store.getState().daoDetail;
        if (!dao.address || !account) {
            // notification here
            return;
        }
        let contract = new Contract(STARLANCER_TOKEN.abi, tokenAddresses, provider);
        let convertedAmount = BigInt(amount) * BigInt(10 ** decimals);

        contract.connect(account);
        let res = await contract.approve(dao.address, convertedAmount);
        await provider.waitForTransaction(res.transaction_hash);

        singletonDAOContract(dao.address);

        daoContractTyped.connect(account);
        await daoContractTyped.fund(tokenAddresses, convertedAmount);
    } catch (e) {
        console.log(e);
    }

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
            end_date: moment().unix() + 60 * 60 * 24 * 30,
            title: convertToTextStruct("Cairo Developer"),
            short_description: convertToTextStruct("Develop smart contracts using cairo 1.0"),
            job_detail: convertToTextStruct("https://starlancer.a2n.finance/jobs/cairo1"),
            // true: open, false: closed,
            job_type: new CairoCustomEnum({ HOURY: true }),
            fixed_price: 0,
            hourly_rate: 20 * 10 ** 18,
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
export const getJobs = async (address: string) => {
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
export const applyJob = async (address: string, account: AccountInterface | undefined) => {
    try {
        if (!address || !account) {
            // notification here
            return;
        }
        singletonDAOContract(address);

        let selectedJob = store.getState().daoDetail.selectedJob;

        let myCallData = daoContractTyped.populate("apply_job",
            [
                selectedJob.index
            ]
        )

        daoContractTyped.connect(account);

        await daoContractTyped.apply_job(myCallData.calldata);


    } catch (e) {
        console.log(e);
    }
}

export const acceptCandidate = async (account: AccountInterface | undefined, candidateIndex: number) => {
    try {
        let { detail: dao } = store.getState().daoDetail;
        if (!dao.address || !account) {
            // notification here
            return;
        }

        singletonDAOContract(dao.address);

        let selectedJob = store.getState().daoDetail.selectedJob;
        let now = moment().unix();
        let myCallData = daoContractTyped.populate("accept_candidate",
            [
                selectedJob.index,
                candidateIndex,
                now,
                now + 265 * 24 * 3600
            ]
        )

        daoContractTyped.connect(account);

        await daoContractTyped.accept_candidate(myCallData.calldata);


    } catch (e) {
        console.log(e);
    }
}


export const getDAOProjects = async (address: string) => {
    try {
        singletonDAOContract(address);
        let projects = await daoContractTyped.get_projects();
        let converedProjects = projects.map(p => convertProjectData(p));
        store.dispatch(setProjects(converedProjects))
    } catch (e) {
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

export const addWhiteListedContributor = async (account: AccountInterface | undefined) => {
    try {
        if (!account) {
            // notification here
            return;
        }
        let { detail: dao } = store.getState().daoDetail;

        singletonDAOContract(dao.address);

        let myCallData = daoContractTyped.populate("add_whitelisted_contributor",
            [
                "0x21ce1d9bf39d475a4bb4b407db0f41d36188f67e152b576d67340dc181167e3",
            ]
        )

        daoContractTyped.connect(account);

        await daoContractTyped.add_whitelisted_contributor(myCallData.calldata);

    } catch (e) {
        console.log(e);
    }

}

export const newTask = async (formValues: FormData, account: AccountInterface | undefined) => {

    try {
        let { detail: dao, selectedProject } = store.getState().daoDetail;
        if (!dao.address || !account) {
            return;
        }
        singletonDAOContract(dao.address);

        let myCallData = daoContractTyped.populate("create_assign_task",
            [
                formValues["developer"],
                selectedProject.index,
                {
                    creator: account?.address,
                    title: convertToTextStruct(formValues["title"]),
                    short_description: convertToTextStruct(formValues["short_description"]),
                    task_detail: convertToTextStruct(formValues["task_detail"]),
                    estimate: parseInt(formValues["estimate"]),
                    status: new CairoCustomEnum({ ASSIGNED: true }),
                    start_date: moment(formValues["date"][0].toString()).unix(),
                    deadline: moment(formValues["date"][1].toString()).unix()
                }
            ]
        )
        daoContractTyped.connect(account);

        await daoContractTyped.create_assign_task(myCallData.calldata);


    } catch (e) {
        console.log(e)
    }

}

export const getProjectTasks = async () => {
    try {
        let { detail: dao, selectedProject } = store.getState().daoDetail;
        if (!dao.address && !selectedProject.title) {
            return;
        }
        singletonDAOContract(dao.address);
        let projectTasks = await daoContractTyped.get_project_tasks(selectedProject.index);
        let convertedTasks = projectTasks.map((task, index) => convertTaskData({ ...task, index: index }));
        store.dispatch(setProps({ att: "projectTasks", value: convertedTasks }));
    } catch (e) {
        console.log(e);
    }
}

export const changeTaskStatus = async (taskIndex: number, status: string, account: AccountInterface | undefined) => {
    try {
        let { detail: dao, selectedProject } = store.getState().daoDetail;
        if (!dao.address || !selectedProject.title || !account) {
            return;
        }
        singletonDAOContract(dao.address);
        let statusEnum: any;
        if (status === "reviewing") {
            statusEnum = {
                REVIEWING: true
            };
        }
        if (status === "complete") {
            statusEnum = {
                COMPLETE: true
            };
        }

        if (status === "cancel") {
            statusEnum = {
                CANCELLED: true
            };
        }
        console.log(statusEnum);
        if (!statusEnum) {
            return;
        }
        daoContractTyped.connect(account);
        let res = await daoContractTyped.change_task_status(selectedProject.index, taskIndex, new CairoCustomEnum(statusEnum));
        await provider.waitForTransaction(res.transaction_hash);
        getProjectTasks();
    } catch (e) {
        console.log(e);
    }
}

export const payDev = async (account: AccountInterface | undefined) => {
    try {
        let { detail: dao, selectedDevIndex } = store.getState().daoDetail;
        if (!dao.address || !account) {
            // notification here
            return;
        }
        singletonDAOContract(dao.address);
        let devContractOption = await daoContractTyped.get_member_current_contract(selectedDevIndex);
        if (!devContractOption.Some) {
            return;
        }

        let devContract = devContractOption.Some;

        let erc20Contract = new Contract(STARLANCER_TOKEN.abi, num.toHexString(devContract.pay_by_token), provider);
        let convertedAmount = BigInt(200.4 * 10 ** 18);

        erc20Contract.connect(account);
        let res = await erc20Contract.approve(dao.address, convertedAmount);
        await provider.waitForTransaction(res.transaction_hash);



        daoContractTyped.connect(account);
        let payRes = await daoContractTyped.pay_member(selectedDevIndex);
        await provider.waitForTransaction(payRes.transaction_hash);

    } catch (e) {
        console.log(e);
    }
}


export const getDevContract = async (devIndex: number) => {
    try {
        let { detail: dao, } = store.getState().daoDetail;
        if (!dao.address) {
            return;
        }

        singletonDAOContract(dao.address);
        let contract = await daoContractTyped.get_member_current_contract(devIndex);
        store.dispatch(setProps({ att: "devContract", value: convertContractData(contract) }));
    } catch (e) {
        console.log(e);
    }

}



export const getUserRoles = async (address: string, account: AccountInterface | undefined) => {
    try {
        if (!address || !account) {
            return;
        }
        singletonDAOContract(address);

        let userRoles = await daoContractTyped.get_member_roles(account?.address);

        store.dispatch(setUserRoles(userRoles));
    } catch (e) {
        console.log(e)
    }

}

export const getProjectRoles = async (account: AccountInterface | undefined) => {
    try {

        let { detail: dao, selectedProject } = store.getState().daoDetail;
        if (!dao.address || !account) {
            return;
        }
        singletonDAOContract(dao.address);

        let projectRoles = await daoContractTyped.get_project_roles(account?.address, selectedProject.index);

        store.dispatch(setProps({ att: "projectRoles", value: projectRoles }));
    } catch (e) {
        console.log(e)
    }

}


export const getJobCandidates = async () => {
    try {
        let { detail: dao, selectedJob } = store.getState().daoDetail;
        if (!dao.address) {
            return;
        }
        singletonDAOContract(dao.address);

        let jobCandidates = await daoContractTyped.get_job_candidates(selectedJob.index);

        store.dispatch(setProps({ att: "jobCandidates", value: jobCandidates }));
    } catch (e) {
        console.log(e)
    }

}



export const getDevelopers = async (address: string) => {
    try {
        if (!address) {
            return;
        }
        singletonDAOContract(address);

        let members = await daoContractTyped.get_members(0, 100);

        store.dispatch(setProps({ att: "members", value: members }));
    } catch (e) {
        console.log(e)
    }

}


export const getBalances = async () => {
    try {
        let { detail: dao } = store.getState().daoDetail;
        if (!dao.address) {
            return;
        }
        let tokenAddresses = Object.keys(WHITELISTED_TOKENS);

        let reqList: Function[] = []
        for (let i = 0; i < tokenAddresses.length; i++) {
            let contract = new Contract(STARLANCER_TOKEN.abi, tokenAddresses[i] || "", provider);
            reqList.push(contract.balance_of(dao.address))
        }

        let balances = await Promise.all(reqList);

        store.dispatch(setProps({ att: "balances", value: balances }));
    } catch (e) {
        console.log(e)
    }

}