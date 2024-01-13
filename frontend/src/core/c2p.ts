import { store } from "@/controller/store";
import { convertContractData, convertDAOData, convertJobData, convertProjectData, convertTaskData } from "@/helpers/data_converter";
import { convertToTextStruct } from "@/utils/cairotext";
import { provider } from "@/utils/network";
import { AccountInterface, CairoCustomEnum, Contract, TypedContract, num } from "starknet";
import { DAO, DAO_FACTORY, STARLANCER_TOKEN, WHITELISTED_TOKENS } from "./config";

import { setDAODetail, setDAOStatistics, setJobs, setProjects, setProps, setUserRoles } from "@/controller/dao/daoDetailSlice";
import { setDAOProps } from "@/controller/dao/daoSlice";
import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
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
        store.dispatch(setDAOProps({ att: "daos", value: daos.reverse() }))
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
    try {
        if (!account) {
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.createDAOAction, value: true }))
        let { kycForm, treasuryManagersForm, memberManagersForm, projectManagersForm, jobManagersForm } = store.getState().daoForm

        let socialNetworks = "";
        socialNetworks = socialNetworks.concat(kycForm.twitter, ",", kycForm.telegram, ",", kycForm.discord, ",", kycForm.facebook);
        let daoDetail = {
            name: convertToTextStruct(kycForm.name),
            short_description: convertToTextStruct(kycForm.short_description),
            detail: convertToTextStruct(kycForm.detail),
            social_networks: convertToTextStruct(socialNetworks)
        }

        let treasuryManagers = treasuryManagersForm.managers.map(m => m.address);
        let memberManagers = memberManagersForm.managers.map(m => m.address);
        let projectManagers = projectManagersForm.managers.map(m => m.address);
        let jobManagers = jobManagersForm.managers.map(m => m.address);

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

        let createRes = await daoFactoryContractTyped.create_dao(
            myCallData.calldata
        )
        await provider.waitForTransaction(createRes.transaction_hash);
        openNotification("Create company DAO", `Company DAO was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Create company DAO", `Fail to create DAO`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.createDAOAction, value: false }))

}

export const fundDAO = async (tokenAddresses: string, account: AccountInterface | undefined, amount: number, decimals: number) => {
    let { detail: dao } = store.getState().daoDetail;
    try {

        if (!dao.address || !account) {
            // notification here
            return;
        }

        store.dispatch(updateActionStatus({ actionName: actionNames.fundDAOAction, value: true }));
        let contract = new Contract(STARLANCER_TOKEN.abi, tokenAddresses, provider);
        let convertedAmount = BigInt(amount) * BigInt(10 ** decimals);

        contract.connect(account);
        let res = await contract.approve(dao.address, convertedAmount);
        await provider.waitForTransaction(res.transaction_hash);

        singletonDAOContract(dao.address);

        daoContractTyped.connect(account);
        let fundRes = await daoContractTyped.fund(tokenAddresses, convertedAmount);
        await provider.waitForTransaction(fundRes.transaction_hash);
        openNotification("Fund DAO", `Funding ${dao.name} is successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getBalances();
    } catch (e) {
        console.log(e);
        openNotification("Fund DAO", `Fail to fund ${dao.name}`, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.fundDAOAction, value: false }));
}

export const createJob = async (formValues: FormData, account: AccountInterface | undefined) => {
    let { detail: dao } = store.getState().daoDetail;
    try {
        if (!dao.address || !account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.newJobAction, value: true }));
        singletonDAOContract(dao.address);

        let decimals = WHITELISTED_TOKENS[formValues["pay_by_token"]].decimals;

        let payAmount = BigInt(formValues["amount"] * 10 ** decimals);

        let job = {
            creator: account.address,
            start_date: moment(formValues["date"][0].toString()).unix(),
            end_date: moment(formValues["date"][1].toString()).unix(),
            title: convertToTextStruct(formValues["title"]),
            short_description: convertToTextStruct(formValues["short_description"]),
            job_detail: convertToTextStruct(formValues["job_detail"]),
            job_type: formValues["job_type"] === 'hourly' ? new CairoCustomEnum({ HOURY: true }) : new CairoCustomEnum({ FIXED_PRICE: true }),
            fixed_price: formValues["job_type"] === 'hourly' ? 0 : payAmount,
            hourly_rate: formValues["job_type"] === 'hourly' ? payAmount : 0,
            pay_by_token: formValues["pay_by_token"],
            status: true
        };
        let myCallData = daoContractTyped.populate("add_job",
            [
                job
            ]
        )

        daoContractTyped.connect(account);

        let jobRes = await daoContractTyped.add_job(myCallData.calldata);
        await provider.waitForTransaction(jobRes.transaction_hash);

        openNotification("New job", `Job "${formValues["title"]}" was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getJobs(dao.address);
        getDAOStatistics(dao.address);
    } catch (e) {
        console.log(e);
        openNotification("New job", `Fail to create new job `, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.newJobAction, value: false }));
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
export const applyJob = async (account: AccountInterface | undefined) => {
    let { detail: dao } = store.getState().daoDetail;
    try {
        if (!dao.address || !account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.applyJobAction, value: true }));
        singletonDAOContract(dao.address);

        let selectedJob = store.getState().daoDetail.selectedJob;

        let myCallData = daoContractTyped.populate("apply_job",
            [
                selectedJob.index
            ]
        )

        daoContractTyped.connect(account);

        let applyRes = await daoContractTyped.apply_job(myCallData.calldata);

        await provider.waitForTransaction(applyRes.transaction_hash);

        openNotification("Apply job", `Apply job "${selectedJob.title}" successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Apply job", `Fail to appply job`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.applyJobAction, value: false }));
}

export const acceptCandidate = async (account: AccountInterface | undefined, candidateIndex: number) => {
    let { detail: dao } = store.getState().daoDetail;
    try {

        if (!dao.address || !account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.acceptCandidateAction, value: true }));

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

        let acceptRes = await daoContractTyped.accept_candidate(myCallData.calldata);

        await provider.waitForTransaction(acceptRes.transaction_hash);

        openNotification("Accept candidate", `The candidate was accepted`, MESSAGE_TYPE.SUCCESS, () => { })
        getDevelopers(dao.address);
        getDAOStatistics(dao.address);
    } catch (e) {
        console.log(e);
        openNotification("Accept candidate", `Fail to accept the candidate`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.acceptCandidateAction, value: false }));

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
export const createProject = async (formValues: FormData, account: AccountInterface | undefined) => {
    let { detail: dao } = store.getState().daoDetail;
    try {
        if (!dao.address || !account) {
            // notification here
            return;
        }

        store.dispatch(updateActionStatus({ actionName: actionNames.createProjectAction, value: true }));
        singletonDAOContract(dao.address);

        let project = {
            creator: account?.address,
            start_date: moment(formValues["date"][0].toString()).unix(),
            end_date: moment(formValues["date"][1].toString()).unix(),
            title: convertToTextStruct(formValues["title"]),
            short_description: convertToTextStruct(formValues["short_description"]),
            project_detail: convertToTextStruct(formValues["project_detail"]),
            status: true
        };
        let myCallData = daoContractTyped.populate("create_project",
            [
                formValues["task_managers"].map(m => m.address),
                formValues["code_reviewers"].map(m => m.address),
                project
            ]
        )

        daoContractTyped.connect(account);

        let projectRes = await daoContractTyped.create_project(myCallData.calldata);
        await provider.waitForTransaction(projectRes.transaction_hash);
        openNotification("Create project", `Project "${formValues["title"]}" was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getDAOProjects(dao.address);
        getDAOStatistics(dao.address);
    } catch (e) {
        console.log(e);
        openNotification("Create project", `Fail to create project "${formValues["title"]}"`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.createProjectAction, value: false }));
}

export const addWhiteListedContributor = async (formValues: FormData, account: AccountInterface | undefined) => {
    let { detail: dao } = store.getState().daoDetail;
    try {
        if (!dao.address || !account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.addContributorAction, value: true }));

        singletonDAOContract(dao.address);

        let myCallData = daoContractTyped.populate("add_whitelisted_contributor",
            [
                formValues["address"]
            ]
        )

        daoContractTyped.connect(account);

        let addRes = await daoContractTyped.add_whitelisted_contributor(myCallData.calldata);

        await provider.waitForTransaction(addRes.transaction_hash);

        openNotification("Add contributor", `Contributor was added successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getUserRoles(dao.address, account);
    } catch (e) {
        console.log(e);
        openNotification("Add contributor", `Fail to add the contributor`, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.addContributorAction, value: false }));
}


export const removeWhiteListedContributor = async (formValues: FormData, account: AccountInterface | undefined) => {
    let { detail: dao } = store.getState().daoDetail;
    try {
        if (!dao.address || !account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.removeContributorAction, value: true }));

        singletonDAOContract(dao.address);

        let myCallData = daoContractTyped.populate("remove_whitelisted_contributor",
            [
                formValues["address"]
            ]
        )

        daoContractTyped.connect(account);

        let removeRes = await daoContractTyped.remove_whitelisted_contributor(myCallData.calldata);

        await provider.waitForTransaction(removeRes.transaction_hash);

        openNotification("Remove contributor", `Contributor was removed successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Remove contributor", `Fail to remove the contributor`, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.removeContributorAction, value: false }));
}


export const newTask = async (formValues: FormData, account: AccountInterface | undefined) => {

    try {
        let { detail: dao, selectedProject } = store.getState().daoDetail;
        if (!dao.address || !account) {
            return;
        }

        store.dispatch(updateActionStatus({ actionName: actionNames.newTaskAction, value: true }));
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

        let newTaskRes = await daoContractTyped.create_assign_task(myCallData.calldata);

        await provider.waitForTransaction(newTaskRes.transaction_hash);

        openNotification("New task", `New task was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getProjectTasks();
        getDAOStatistics(dao.address);
    } catch (e) {
        console.log(e);
        openNotification("New task", `Fail to create new task`, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.newTaskAction, value: false }));
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
        store.dispatch(updateActionStatus({ actionName: actionNames.changeTaskStatusAction, value: true }));
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
        if (!statusEnum) {
            return;
        }
        daoContractTyped.connect(account);
        let res = await daoContractTyped.change_task_status(selectedProject.index, taskIndex, new CairoCustomEnum(statusEnum));
        await provider.waitForTransaction(res.transaction_hash);
        openNotification("Update task status", `Task status was updated successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getProjectTasks();
    } catch (e) {
        console.log(e);
        openNotification("Update task status", `Fail to update the task status`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.changeTaskStatusAction, value: false }));
}

export const getPaymentAmount = async () => {
    try {
        let { detail: dao, selectedDevIndex } = store.getState().daoDetail;
        if (!dao.address) {
            return;
        }

        singletonDAOContract(dao.address);
        let paymentAmount = await daoContractTyped.get_payment_amount(selectedDevIndex);
        store.dispatch(setProps({ att: "paymentAmount", value: paymentAmount }));
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
        store.dispatch(updateActionStatus({ actionName: actionNames.payDevAction, value: true }));
        singletonDAOContract(dao.address);
        let devContractOption = await daoContractTyped.get_member_current_contract(selectedDevIndex);
        if (!devContractOption.Some) {
            return;
        }
        daoContractTyped.connect(account);
        let payRes = await daoContractTyped.pay_member(selectedDevIndex);
        await provider.waitForTransaction(payRes.transaction_hash);
        openNotification("Dev Payout", `A payment was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Dev Payout", `Fail to create the payment`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.payDevAction, value: false }));
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


export const updateContract = async (account: AccountInterface | undefined) => {
    try {
        const {selectedDevIndex} = store.getState().daoDetail;
        try {
            let { detail: dao } = store.getState().daoDetail;
            if (!dao.address || !account) {
                return;
            }
            singletonDAOContract(dao.address);
            await getDevContract(selectedDevIndex);

            const {devContract} = store.getState().daoDetail;
    
            store.dispatch(updateActionStatus({ actionName: actionNames.updateContractAction, value: true }));
    
            let myCallData = daoContractTyped.populate("update_contract",
                [
                    selectedDevIndex,
                    0,
                    {
                        start_date: devContract.start_date,
                        end_date: devContract.end_date,
                        contract_type: new CairoCustomEnum({HOURY: true}),
                        fixed_price: 0,
                        hourly_rate: BigInt(1.5 * 10**18),
                        pay_by_token: devContract.pay_by_token,
                        status: true,
                    }
                ]
            )
            daoContractTyped.connect(account);
    
            let updateRes = await daoContractTyped.update_contract(myCallData.calldata);
    
            await provider.waitForTransaction(updateRes.transaction_hash);
    
            openNotification("Update contract", `Dev contract was updated successful`, MESSAGE_TYPE.SUCCESS, () => { })
        } catch (e) {
            console.log(e);
            openNotification("Update contract", `Fail to update dev contract`, MESSAGE_TYPE.ERROR, () => { })
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.updateContractAction, value: false }));
    } catch (error) {
        
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