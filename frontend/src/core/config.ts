import dao_factory_abi from "@/abis/dao_factory.json";
import dao_abi from "@/abis/dao.json";
import p2p_mkp_abi from "@/abis/p2p_mkp.json";

export const dao_factory = {
    address: process.env.NEXT_PUBLIC_DAO_FACTORY_ADDRESS,
    abi: dao_factory_abi
}

export const p2p_mkp = {
    address: process.env.NEXT_PUBLIC_P2P_JOBS_MARKETPLACE,
    abi: p2p_mkp_abi
}

export const dao = {
    abi: dao_abi
}