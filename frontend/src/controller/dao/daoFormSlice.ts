import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DAOFormsState = {
    currentStep: number,
    kycForm: {
        name: string,
        short_description: string,
        detail: string,
        twitter: string,
        telegram: string,
        facebook: string,
        discord: string
    },
    treasuryManagersForm: {managers: {address: string}[]},
    memberManagersForm: {managers: {address: string}[]},
    projectManagersForm: {managers: {address: string}[]},
    jobManagersForm: {managers: {address: string}[]}
}


const initialState: DAOFormsState = {
    currentStep: 0,
    kycForm: {
        name: "",
        short_description: "",
        detail: "",
        twitter: "",
        telegram: "",
        facebook: "",
        discord: ""
    },
    treasuryManagersForm: {
        managers: [
            { address: ""}
        ]
    },
    memberManagersForm: {
        managers: [
            { address: ""}
        ]
    },
    projectManagersForm: {
        managers: [
            { address: ""}
        ]
    },
    jobManagersForm: {
        managers: [
            { address: ""}
        ]
    }

}

export const daoFormSlice = createSlice({
    name: 'daoForm',
    initialState: initialState,
    reducers: {
        setDaoFormProps: (state: DAOFormsState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setDaoFormProps } = daoFormSlice.actions;
export default daoFormSlice.reducer;