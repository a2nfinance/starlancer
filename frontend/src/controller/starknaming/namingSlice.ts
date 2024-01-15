import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NamingState = {
    domain: string
}

const initialState: NamingState = {
    domain: ""
}
export const platformFeeSlice = createSlice({
    name: 'starknaming',
    initialState: initialState,
    reducers: {
        setProps: (state: NamingState, action: PayloadAction<string>) => {
            state.domain = action.payload
        }
    }
})
export const { setProps } = platformFeeSlice.actions;
export default platformFeeSlice.reducer;