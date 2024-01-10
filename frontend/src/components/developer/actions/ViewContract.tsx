import { useAppSelector } from "@/controller/hooks";
import { WHITELISTED_TOKENS } from "@/core/config";
import { useAddress } from "@/hooks/useAddress";
import { Button, Col, Descriptions, Row, Tag } from "antd"
import moment from "moment"

export const ViewContract = () => {
    const { devContract } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();
    return (
        <>
            <Descriptions layout="vertical" column={1}>
                <Descriptions.Item label={"Start date"}>
                    {moment(parseInt(devContract.start_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label={"End date"}>
                    {moment(parseInt(devContract.end_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>

            </Descriptions>
            <Descriptions column={2} layout="vertical">
                <Descriptions.Item label={"Contract type"}>
                    {devContract.contract_type}
                </Descriptions.Item>
                <Descriptions.Item label={devContract.contract_type === "hourly" ? "Hourly rate" : "Fixed amount"}>
                    {(BigInt(devContract.hourly_rate) / BigInt(10 ** 18)).toString()} {WHITELISTED_TOKENS[devContract.pay_by_token]?.symbol}
                </Descriptions.Item>
            </Descriptions>
            <Descriptions column={2} layout="vertical">
                <Descriptions.Item label={"Pay by token"}>
                    <Button onClick={() => openLinkToExplorer(devContract.pay_by_token)}>
                        {WHITELISTED_TOKENS[devContract.pay_by_token]?.name}
                    </Button>
                </Descriptions.Item>

                <Descriptions.Item label={"Status"}>
                    {devContract.status && <Tag color="green">active</Tag>}
                    {!devContract.status && <Tag color="red">active</Tag>}
                </Descriptions.Item>

            </Descriptions>
        </>

    )
}