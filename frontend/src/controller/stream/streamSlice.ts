import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Stream = {
        _id?: string,
        title: string, 
        owner: string,
        address: string,
        start_date: number,
        recipient: string,
        unlock_every: number,
        unlock_type: number,
        unlock_number: number,
        unlock_amount_each_time: number,
        created_at: string,
        prepaid: number,
        status: number,
        cancel_previlege: number,
        transfer_previlege: number,
        total_fund?: number,
        withdrew?: number,
}


type StreamState = {
    incomingStreams: Stream[],
    outgoingStreams: Stream[],
}

const initialState: StreamState = {
    incomingStreams: [],
    outgoingStreams: [],
}

export const streamSlice = createSlice({
    name: 'stream',
    initialState: initialState,
    reducers: {
        setStreamProps: (state: StreamState, action: PayloadAction<{ att: string, value: any }>) => {
            state[action.payload.att] = action.payload.value
        }
    }
})
export const { setStreamProps } = streamSlice.actions;
export default streamSlice.reducer;