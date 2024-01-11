import { WHITELISTED_TOKENS } from "@/core/config";

export const useToken = () => {
    const convertToToken = (pay_by_token: string, amount: number) => {
        return (Number(BigInt(amount)) / Number(10**WHITELISTED_TOKENS[pay_by_token].decimals)).toString();
    };


    
    return { convertToToken };
};