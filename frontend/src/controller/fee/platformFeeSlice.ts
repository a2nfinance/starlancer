import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type FeeState = {
    rateFee: number
}

const initialState: FeeState = {
    rateFee: 20
}
export const platformFeeSlice = createSlice({
    name: 'platformFee',
    initialState: initialState,
    reducers: {
        setProps: (state: FeeState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setProps } = platformFeeSlice.actions;
export default platformFeeSlice.reducer;