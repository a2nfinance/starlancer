import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job, Task } from '../dao/daoDetailSlice';
import moment from 'moment';

type P2PState = {
    isLoadingJobs: boolean,
    jobs: Job[],
    createdJobs: Job[],
    myJobs: Job[],
    jobTasks: Task[],
    selectedJob: Job,
    jobCandidates: string[]
}

const initialState: P2PState = {
    isLoadingJobs: true,
    jobs: [],
    createdJobs: [],
    myJobs: [],
    jobTasks: [],
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
    jobCandidates: []
}
export const p2pSlice = createSlice({
    name: 'p2p',
    initialState: initialState,
    reducers: {
        setProps: (state: P2PState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setProps } = p2pSlice.actions;
export default p2pSlice.reducer;