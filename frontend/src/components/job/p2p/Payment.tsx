import { useAppSelector } from "@/controller/hooks"
import { payDev } from "@/core/p2p";
import { useAccount } from "@starknet-react/core";
import { Button, Descriptions, Divider } from "antd"
import { useEffect } from "react";

export const Payment = () => {
    const { paymentAmount, selectedJob } = useAppSelector(state => state.p2p);

    const {rateFee} = useAppSelector(state => state.platformFee);
    const {account} = useAccount();
    const {payDevAction} = useAppSelector(state => state.process);
    return (
        <>
            <Descriptions column={1}>
                <Descriptions.Item label={"Pay dev"}>
                {(Number(BigInt(paymentAmount)) * Number(10000) / ((Number(10000 + rateFee)) * Number(BigInt(10**18)))).toFixed(2)}
                </Descriptions.Item>
                <Descriptions.Item label={"Platform fee"}>
                    {rateFee / 100} %
                </Descriptions.Item>
                <Descriptions.Item label={"Total"}>
                    
                    {(Number(BigInt(paymentAmount)) / Number(BigInt(10**18))).toFixed(5)}
                </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Button type="primary" disabled={selectedJob.creator !== account?.address} loading={payDevAction} size="large" style={{width: "100%"}} onClick={() => payDev(account)}>Pay now</Button>
        </>
    )
}