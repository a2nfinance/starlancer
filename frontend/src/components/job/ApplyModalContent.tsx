import { useAppSelector } from "@/controller/hooks"
import { WHITELISTED_TOKENS } from "@/core/config";
import { useAddress } from "@/hooks/useAddress";
import { useToken } from "@/hooks/useToken";
import { Button, Descriptions } from "antd"

export const ApplyModalContent = () => {
    const {selectedJob} = useAppSelector(state => state.daoDetail);
    const { convertToToken } = useToken();
    const { openLinkToExplorer, getShortAddress } = useAddress()
    return (
        <>
        <Descriptions layout="vertical" column={1}>
                    <Descriptions.Item label="Title">
                        {selectedJob.title}
                    </Descriptions.Item>
                    <Descriptions.Item label="Short description">
                        {selectedJob.short_description}
                    </Descriptions.Item>

                </Descriptions>
                <Descriptions layout="vertical" column={2}>
                    <Descriptions.Item label="Start date">
                        {new Date(parseInt(selectedJob.start_date.toString()) * 1000).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="End date">
                        {new Date(parseInt(selectedJob.end_date.toString()) * 1000).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Contract type">
                        {selectedJob.job_type.toUpperCase()}
                    </Descriptions.Item>
                    <Descriptions.Item label={selectedJob.job_type === 'hourly' ? "Rate" : "Amount"}>
                        {selectedJob.job_type === 'hourly' ? convertToToken(selectedJob.pay_by_token, selectedJob.hourly_rate) : convertToToken(selectedJob.pay_by_token, selectedJob.fixed_price)}
                    </Descriptions.Item>
                    <Descriptions.Item label={"Token Payment"}>
                        <Button onClick={() => openLinkToExplorer(selectedJob.pay_by_token)}>
                            {getShortAddress(selectedJob.pay_by_token)} | {WHITELISTED_TOKENS[selectedJob.pay_by_token]?.name} |  {WHITELISTED_TOKENS[selectedJob.pay_by_token]?.symbol}
                        </Button>
                    </Descriptions.Item>
                </Descriptions>
        </>
    )
}