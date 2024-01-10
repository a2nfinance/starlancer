import { useAppSelector } from "@/controller/hooks"
import { payDev } from "@/core/c2p";
import { useAccount } from "@starknet-react/core";
import { Button, Descriptions, Divider } from "antd"
import { useEffect } from "react";

export const Payment = () => {
    const {rateFee} = useAppSelector(state => state.platformFee);
    const {account} = useAccount();
    useEffect(() => {
            // get payment need
    }, [])
    return (
        <>
            <Descriptions column={1}>
                <Descriptions.Item label={"Pay dev"}>
                    {0}
                </Descriptions.Item>
                <Descriptions.Item label={"Platform fee"}>
                    {rateFee / 100} %
                </Descriptions.Item>
                <Descriptions.Item label={"Total"}>
                    {0}
                </Descriptions.Item>
            </Descriptions>
            <Divider />
            <Button type="primary" size="large" style={{width: "100%"}} onClick={() => payDev(account)}>Pay now</Button>
        </>
    )
}