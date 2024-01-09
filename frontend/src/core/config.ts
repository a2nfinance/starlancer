import dao_factory_abi from "@/abis/dao_factory.json";
import dao_abi from "@/abis/dao.json";
import p2p_mkp_abi from "@/abis/p2p_mkp.json";

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

export const TESTNET_EXPLORER="https://testnet.starkscan.co"