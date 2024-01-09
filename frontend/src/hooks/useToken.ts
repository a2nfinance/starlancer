export const useToken = () => {
    const convertToToken = (amount: number) => {
        return (BigInt(amount) / BigInt(10**18)).toString();
    };


    
    return { convertToToken };
};