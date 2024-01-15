import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import platformFeeReducer from "./fee/platformFeeSlice";
import daoReducer from "./dao/daoSlice";
import daoDetailReducer from "./dao/daoDetailSlice";
import daoFormReducer from "./dao/daoFormSlice";
import processReducer from './process/processSlice';
import p2pReducer from "./p2p/p2pSlice";
import streamReducer from "./stream/streamSlice";
import starknamingReducer from "./starknaming/namingSlice";


export function makeStore() {
    return configureStore({
        reducer: {
            dao: daoReducer,
            daoDetail: daoDetailReducer,
            daoForm: daoFormReducer,
            process: processReducer,
            platformFee: platformFeeReducer,
            p2p: p2pReducer,
            stream: streamReducer,
            starknaming: starknamingReducer
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
    })
}

export const store = makeStore()

export type AppState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    AppState,
    unknown,
    Action<string>
>  