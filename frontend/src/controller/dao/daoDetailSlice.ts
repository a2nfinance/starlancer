import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

type UserRoles = {
    is_job_manager: boolean,
    is_member: boolean,
    is_member_manager: boolean,
    is_project_manager: boolean,
    is_treasury_manager: boolean
}
export type DaoDetailState = {
    detail: Detail,
    members: string[],
    statistics: Statistics,
    projects: Project[],
    userRoles: UserRoles,
    jobs: Job[]
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
    jobs: []
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
    }
})
export const { setDAODetail, setMembers, setDAOStatistics, setProjects, setUserRoles, setJobs } = daoDetailSlice.actions;
export default daoDetailSlice.reducer;