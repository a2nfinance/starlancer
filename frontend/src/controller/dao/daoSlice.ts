import { createSlice, PayloadAction } from '@reduxjs/toolkit';



type DaoState = {
    isLoadingDAOs: boolean,
    daos: {
        address: string,
        name: string,
        short_description: string,
        detail: string,
        social_networks: string[],
        num_members?: number,
        num_projects?: number,
        num_jobs?: number
    }[],

}

const initialState: DaoState = {
    isLoadingDAOs: true,
    daos: []
}

export const daoSlice = createSlice({
    name: 'dao',
    initialState: initialState,
    reducers: {
        setDAOProps: (state: DaoState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setDAOProps } = daoSlice.actions;
export default daoSlice.reducer;