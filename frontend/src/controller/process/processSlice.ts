import {
    createSlice,
    PayloadAction
} from "@reduxjs/toolkit";

export const actionNames = {
    createDAOAction: "createDAOAction",
    fundDAOAction: "fundDAOAction",
    createProjectAction: "createProjectAction",
    newJobAction: "newJobAction",
    applyJobAction: "applyJobAction",
    acceptCandidateAction: "acceptCandidateAction",
    addContributorAction: "addContributor",
    removeContributorAction: "removeContributor",
    newTaskAction: "newTaskAction",
    changeTaskStatusAction: "changeTaskStatusAction",
    payDevAction: "payDevAction"
}


type Processes = {
    [key: string]: boolean
}

const initialState: Processes = {
    createDAOAction: false,
    fundDAOAction: false,
    createProjectAction: false,
    newJobAction: false,
    applyJobAction: false,
    acceptCandidateAction: false,
    addContributorAction: false,
    removeContributorAction: false,
    newTaskAction: false,
    changeTaskStatusAction: false,
    payDevAction: false
}

export const processesSlice = createSlice({
    name: 'process',
    initialState,
    reducers: {
        updateActionStatus: (state, action: PayloadAction<{ actionName: string, value: boolean }>) => {
            state[action.payload.actionName] = action.payload.value;
        },
    }
})

export const { updateActionStatus } = processesSlice.actions;
export default processesSlice.reducer;