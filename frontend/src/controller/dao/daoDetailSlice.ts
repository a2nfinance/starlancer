import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import moment from 'moment';

export type Detail = {
    address: string,
    name: string,
    short_description: string,
    detail: string,
    social_networks: string[],
}

type Statistics = {
    num_members: number,
    num_projects: number,
    num_jobs: number
}
type Project = {
    index?: number,
    creator: string,
    start_date: number,
    end_date: number,
    title: string,
    short_description: string,
    project_detail: string,
    // true: active, false: closed
    status: boolean
}

type Job = {
    index?: number,
    creator: string,
    start_date: number,
    end_date: number,
    title: string,
    short_description: string,
    job_detail: string,
    // true: open, false: closed,
    job_type: string,
    fixed_price: number,
    hourly_rate: number,
    pay_by_token: string,
    status: boolean
}

type DevContract = {
    start_date: number,
    end_date: number,
    contract_type: string,
    fixed_price: number,
    hourly_rate: number,
    pay_by_token: string,
    status: boolean,
}

export type Task = {
    index?: number,
    creator: string,
    start_date: number,
    deadline: number,
    title: string,
    short_description: string,
    task_detail: string,
    // hours
    estimate: number,
    status: string,
}

export type UserRoles = {
    is_job_manager: boolean,
    is_member: boolean,
    is_member_manager: boolean,
    is_project_manager: boolean,
    is_treasury_manager: boolean
}

export type ProjectRoles = {
    is_task_manager: boolean,
    is_code_reviewer: boolean
}

export type DaoDetailState = {
    detail: Detail,
    members: string[],
    statistics: Statistics,
    projects: Project[],
    userRoles: UserRoles,
    projectRoles: ProjectRoles,
    jobs: Job[],
    selectedJob: Job,
    selectedProject: Project,
    jobCandidates: string[],
    balances: number[],
    projectTasks: Task[],
    devContract: DevContract,
    paymentAmount: number,
    selectedDevIndex: number
}

const initialState: DaoDetailState = {
    detail: {
        address: "",
        name: "",
        short_description: "",
        detail: "",
        social_networks: [],
    },
    members: [],
    statistics: {
        num_members: 0,
        num_projects: 0,
        num_jobs: 0
    },
    projects: [],
    userRoles: {
        is_job_manager: false,
        is_member: false,
        is_member_manager: false,
        is_project_manager: false,
        is_treasury_manager: false
    },
    projectRoles: {
        is_task_manager: false,
        is_code_reviewer: false
    },
    jobs: [],
    selectedJob: {
        creator: "",
        start_date: moment().unix(),
        end_date: moment().unix(),
        title: "",
        short_description: "",
        job_detail: "",
        // true: open, false: closed,
        job_type: "",
        fixed_price: 0,
        hourly_rate: 0,
        pay_by_token: "",
        status: false
    },
    selectedProject: {
        creator: "",
        start_date: moment().unix(),
        end_date: moment().unix(),
        title: "",
        short_description: "",
        project_detail: "",
        // true: active, false: closed
        status: false
    },
    jobCandidates: [],
    balances: [],
    projectTasks: [],
    devContract: {
        start_date: moment().unix(),
        end_date: moment().unix(),
        contract_type: "",
        fixed_price: 0,
        hourly_rate: 0,
        pay_by_token: "",
        status: false,
    },
    paymentAmount: 0,
    selectedDevIndex: 0
}

export const daoDetailSlice = createSlice({
    name: 'daoDetail',
    initialState: initialState,
    reducers: {
        setDAODetail: (state: DaoDetailState, action: PayloadAction<Detail>) => {
            state.detail = action.payload;
        },

        setMembers: (state: DaoDetailState, action: PayloadAction<any[]>) => {
            state.members = action.payload
        },

        setDAOStatistics: (state: DaoDetailState, action: PayloadAction<any>) => {
            state.statistics = action.payload
        },

        setProjects: (state: DaoDetailState, action: PayloadAction<Project[]>) => {
            state.projects = action.payload
        },
        setUserRoles: (state: DaoDetailState, action: PayloadAction<UserRoles>) => {
            state.userRoles = action.payload
        },
        setJobs: (state: DaoDetailState, action: PayloadAction<Job[]>) => {
            state.jobs = action.payload
        },
        setProps: (state: DaoDetailState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setDAODetail, setMembers, setDAOStatistics, setProjects, setUserRoles, setJobs, setProps } = daoDetailSlice.actions;
export default daoDetailSlice.reducer;