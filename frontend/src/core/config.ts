import dao_factory_abi from "@/abis/dao_factory.json";
import dao_abi from "@/abis/dao.json";
import p2p_mkp_abi from "@/abis/p2p_mkp.json";
import token_abi from "@/abis/starlancer_token.json"

export const DAO_FACTORY = {
    address: process.env.NEXT_PUBLIC_DAO_FACTORY_ADDRESS,
    abi: dao_factory_abi
}

export const P2P_MKP = {
    address: process.env.NEXT_PUBLIC_P2P_JOBS_MARKETPLACE,
    abi: p2p_mkp_abi
}

export const DAO = {
    abi: dao_abi
}

export const STARK_NAMING = {
    address: process.env.NEXT_PUBLIC_STARK_NAMING
}

export const STARLANCER_TOKEN = {
    address: process.env.NEXT_PUBLIC_STARLANCER_TOKEN,
    abi: token_abi
}

export const TESTNET_EXPLORER="https://testnet.starkscan.co"

export const WHITELISTED_TOKENS = {
    "0x7b4c6969214f4bb332eaa9221ca6ce53394a385f41282a08dc4b6d5b99f089c": {
        name: "Starlaner: SLR",
        decimals: 18,
        symbol: "SLR"
    },
    "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7": {
        name: "StarkGate: ETH",
        decimals: 18,
        symbol: "ETH"
    },
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d": {
        name: "StarkNet Token",
        decimals: 18,
        symbol: "STRK"
    },
    "0x025731f5f9629ff74d1c5f787ad1ea0ebb9157210047f6c9e3a974f771550cf4": {
        name: "StarkGate: LUSD",
        decimals: 18,
        symbol: "LUSD"
    }


}