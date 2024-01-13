import { useAppSelector } from "@/controller/hooks"
import { payDev } from "@/core/c2p";
import { useAccount } from "@starknet-react/core";
import { Button, Descriptions, Divider } from "antd"
import { useEffect } from "react";

export const Payment = () => {
    const { paymentAmount } = useAppSelector(state => state.daoDetail);
    const {rateFee} = useAppSelector(state => state.platformFee);
    const {account} = useAccount();
    const {payDevAction} = useAppSelector(state => state.process);
    return (
        <>
            <Descriptions column={1}>
                <Descriptions.Item label={"Pay dev"}>
                    {(Number(BigInt(paymentAmount)) / Number(BigInt(10**18))).toString()}
                </Descriptions.Item>
                <Descriptions.Item label={"Platform fee"}>
                    {rateFee / 100} %
                </Descriptions.Item>
                <Descriptions.Item label={"Total"}>
                    {((Number(BigInt(paymentAmount)) / Number(BigInt(10**18))) *(1 + rateFee / 10000)).toFixed(5)}
                </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Button type="primary" loading={payDevAction} size="large" style={{width: "100%"}} onClick={() => payDev(account)}>Pay now</Button>
        </>
    )
}