import { store } from "@/controller/store";
import { convertContractData, convertDAOData, convertJobData, convertProjectData, convertTaskData } from "@/helpers/data_converter";
import { convertToTextStruct } from "@/utils/cairotext";
import { provider } from "@/utils/network";
import { AccountInterface, CairoCustomEnum, Contract, TypedContract, num } from "starknet";
import { P2P_MKP, STARLANCER_TOKEN, WHITELISTED_TOKENS } from "./config";



import { actionNames, updateActionStatus } from "@/controller/process/processSlice";
import { MESSAGE_TYPE, openNotification } from "@/utils/noti";
import moment from "moment";
import { setProps } from "@/controller/p2p/p2pSlice";



let p2pContractTyped: TypedContract<typeof P2P_MKP.abi>;

if (!p2pContractTyped) {
    let p2pContract = new Contract(P2P_MKP.abi, P2P_MKP.address || "", provider);
    p2pContractTyped = p2pContract.typed(P2P_MKP.abi);
}


export const createJob = async (formValues: FormData, account: AccountInterface | undefined) => {

    try {
        if (!account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.newJobAction, value: true }));

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
        let myCallData = p2pContractTyped.populate("add_job",
            [
                job
            ]
        )

        p2pContractTyped.connect(account);

        let jobRes = await p2pContractTyped.add_job(myCallData.calldata);
        await provider.waitForTransaction(jobRes.transaction_hash);

        openNotification("New job", `Job "${formValues["title"]}" was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("New job", `Fail to create new job `, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.newJobAction, value: false }));
}


export const getJobs = async () => {

    try {
        let jobs = await p2pContractTyped.get_jobs(0, 100);
        let converedJobs = jobs.map(job => convertJobData(job));
        store.dispatch(setProps({ att: "jobs", value: converedJobs }))
        store.dispatch(setProps({ att: "isLoadingJobs", value: false }));
    } catch (e) {
        console.log(e)
    }
}

export const getMyCreatedJobs = async (account: AccountInterface | undefined) => {
    try {
        if (!account) {
            return;
        }
        let jobs = await p2pContractTyped.get_employer_jobs(account.address, 0, 100);
        console.log(jobs);
        let converedJobs = jobs.map(job => convertJobData(job));
        store.dispatch(setProps({ att: "createdJobs", value: converedJobs }))
    } catch (e) {

    }

}

export const applyJob = async (account: AccountInterface | undefined) => {
    try {
        if (!account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.applyJobAction, value: true }));

        let selectedJob = store.getState().p2p.selectedJob;

        let myCallData = p2pContractTyped.populate("apply_job",
            [
                selectedJob.index
            ]
        )

        p2pContractTyped.connect(account);

        let applyRes = await p2pContractTyped.apply_job(myCallData.calldata);

        await provider.waitForTransaction(applyRes.transaction_hash);

        openNotification("Apply job", `Apply job "${selectedJob.title}" successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Apply job", `Fail to appply job`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.applyJobAction, value: false }));
}


export const getJobCandidates = async () => {
    try {
        let { selectedJob } = store.getState().p2p;
        if (!selectedJob.title) {
            return;
        }

        let jobCandidates = await p2pContractTyped.get_job_candidates(selectedJob.index);
        console.log(jobCandidates)

        store.dispatch(setProps({ att: "jobCandidates", value: jobCandidates }));
    } catch (e) {
        console.log(e)
    }

}


export const getEmployerJobCandidates = async (account: AccountInterface | undefined) => {
    try {
        let { selectedJob } = store.getState().p2p;
        console.log("SelectedJob", selectedJob, account)
        if (!account || !selectedJob.title) {
            return;
        }

        let jobCandidates = await p2pContractTyped.get_job_candidates_by_local_index(account.address, selectedJob.index);
        console.log("jobCandidates", jobCandidates);
        store.dispatch(setProps({ att: "jobCandidates", value: jobCandidates }));
    } catch (e) {
        console.log(e)
    }

}

export const acceptCandidate = async (account: AccountInterface | undefined, candidateIndex: number) => {
    try {
        let selectedJob = store.getState().p2p.selectedJob;
        if (!selectedJob.title || !account) {
            // notification here
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.acceptCandidateAction, value: true }));

        let now = moment().unix();
        let myCallData = p2pContractTyped.populate("accept_candidate",
            [
                selectedJob.index,
                candidateIndex,
                now,
                now + 265 * 24 * 3600
            ]
        )

        p2pContractTyped.connect(account);

        let acceptRes = await p2pContractTyped.accept_candidate(myCallData.calldata);

        await provider.waitForTransaction(acceptRes.transaction_hash);

        openNotification("Accept candidate", `The candidate was accepted`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Accept candidate", `Fail to accept the candidate`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.acceptCandidateAction, value: false }));

}


export const newTask = async (formValues: FormData, account: AccountInterface | undefined) => {

    try {
        let { selectedJob } = store.getState().p2p;
        if (!selectedJob.title || !account) {
            return;
        }

        store.dispatch(updateActionStatus({ actionName: actionNames.newTaskAction, value: true }));


        let myCallData = p2pContractTyped.populate("create_job_task",
            [
                selectedJob.index,
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
        p2pContractTyped.connect(account);

        let newTaskRes = await p2pContractTyped.create_job_task(myCallData.calldata);

        await provider.waitForTransaction(newTaskRes.transaction_hash);

        openNotification("New task", `New task was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getJobTasks(account);
    } catch (e) {
        console.log(e);
        openNotification("New task", `Fail to create new task`, MESSAGE_TYPE.ERROR, () => { })
    }
    store.dispatch(updateActionStatus({ actionName: actionNames.newTaskAction, value: false }));
}


export const getJobTasks = async (account: AccountInterface | undefined) => {
    try {
        let { selectedJob } = store.getState().p2p;
        if (!selectedJob.title) {
            return;
        }

        let employerTasks = await p2pContractTyped.get_employer_job_tasks(account?.address, selectedJob.index);
        let convertedTasks = employerTasks.map((task, index) => convertTaskData({ ...task, index: index }));
        store.dispatch(setProps({ att: "jobTasks", value: convertedTasks }));
    } catch (e) {
        console.log(e);
    }
}

export const changeTaskStatus = async (taskIndex: number, status: string, account: AccountInterface | undefined) => {
    try {
        let { selectedJob } = store.getState().p2p;
        if (!selectedJob.title || !account) {
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.changeTaskStatusAction, value: true }));
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
        p2pContractTyped.connect(account);
        let res = await p2pContractTyped.change_job_task_status(selectedJob.index, taskIndex, new CairoCustomEnum(statusEnum));
        await provider.waitForTransaction(res.transaction_hash);
        openNotification("Update task status", `Task status was updated successful`, MESSAGE_TYPE.SUCCESS, () => { })
        getJobTasks(account);
    } catch (e) {
        console.log(e);
        openNotification("Update task status", `Fail to update the task status`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.changeTaskStatusAction, value: false }));
}

export const getPaymentAmount = async (account: AccountInterface | undefined) => {
    try {
        let { selectedJob } = store.getState().p2p;
        if (!selectedJob.title || !account) {
            return;
        }

        let paymentAmount = await p2pContractTyped.get_job_payment_amount(account.address, selectedJob.index);
        store.dispatch(setProps({ att: "paymentAmount", value: paymentAmount }));
    } catch (e) {
        console.log(e);
    }
}

export const payDev = async (account: AccountInterface | undefined) => {
    try {
        let { selectedJob, paymentAmount } = store.getState().p2p;
        if (!selectedJob.title || !account) {
            return;
        }
        store.dispatch(updateActionStatus({ actionName: actionNames.payDevAction, value: true }));
        
        let contract = new Contract(STARLANCER_TOKEN.abi, selectedJob.pay_by_token, provider);

        contract.connect(account);
        let res = await contract.approve(P2P_MKP.address, paymentAmount);
        await provider.waitForTransaction(res.transaction_hash);
        p2pContractTyped.connect(account);
        let payRes = await p2pContractTyped.pay_dev(selectedJob.index);
        await provider.waitForTransaction(payRes.transaction_hash);
        openNotification("Dev Payout", `A payment was created successful`, MESSAGE_TYPE.SUCCESS, () => { })
    } catch (e) {
        console.log(e);
        openNotification("Dev Payout", `Fail to create the payment`, MESSAGE_TYPE.ERROR, () => { })
    }

    store.dispatch(updateActionStatus({ actionName: actionNames.payDevAction, value: false }));
}