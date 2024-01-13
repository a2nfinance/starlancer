import { Job } from "@/controller/dao/daoDetailSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { setProps } from "@/controller/p2p/p2pSlice";
import { WHITELISTED_TOKENS } from "@/core/config";
import { applyJob } from "@/core/p2p";
import { useAddress } from "@/hooks/useAddress";
import { useToken } from "@/hooks/useToken";
import { headStyle1 } from "@/theme/layout";
import { useAccount } from "@starknet-react/core";
import { Button, Card, Col, Descriptions, Flex, Popover, Row } from "antd";
import { useCallback } from "react";
import { MdOutlineWorkOutline } from "react-icons/md";
import { CandidateList } from "./CandidateList";

export const JobItem = ({ index, job }: { index: number, job: Job }) => {
    const { account } = useAccount();
    const { openLinkToExplorer, getShortAddress } = useAddress();
    const { convertToToken } = useToken();
    const { applyJobAction } = useAppSelector(state => state.process);
    const dispatch = useAppDispatch();

    const handleApplyJob = useCallback(() => {
        dispatch(setProps({ att: "selectedJob", value: { ...job, index } }));
        applyJob(account);
    }, [account?.address])
    return (
        <Card title={<Flex align='center' gap={5}><MdOutlineWorkOutline />{job.title}</Flex>} headStyle={headStyle1}>
            <Descriptions layout="vertical" column={1}>
                <Descriptions.Item label="Short description">
                    {job.short_description}
                </Descriptions.Item>

            </Descriptions>
            <Descriptions layout="vertical" column={2}>
                <Descriptions.Item label="Start date">
                    {new Date(parseInt(job.start_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="End date">
                    {new Date(parseInt(job.end_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Contract type">
                    {job.job_type.toUpperCase()}
                </Descriptions.Item>
                <Descriptions.Item label={job.job_type === 'hourly' ? "Rate" : "Amount"}>
                    {job.job_type === 'hourly' ? convertToToken(job.pay_by_token, job.hourly_rate) : convertToToken(job.pay_by_token, job.fixed_price)}
                </Descriptions.Item>
                <Descriptions.Item label={"Token Payment"}>
                    <Button onClick={() => openLinkToExplorer(job.pay_by_token)}>
                        {WHITELISTED_TOKENS[job.pay_by_token]?.name} |  {WHITELISTED_TOKENS[job.pay_by_token]?.symbol}
                    </Button>
                </Descriptions.Item>
                <Descriptions.Item label="Employer">
                    <Button onClick={() => openLinkToExplorer(job.creator)}>
                        {getShortAddress(job.creator)}
                    </Button>
                </Descriptions.Item>
            </Descriptions>
            <Row gutter={12}>
                <Col span={12}>
                    <Popover content={<>
                        <Button size="large" type="primary" disabled={!account || account?.address === job.creator} loading={applyJobAction} onClick={() => handleApplyJob()}>Accept</Button>
                    </>} title="Are you sure to apply this job?" trigger="hover">
                        <Button size="large" type="primary" block>Apply</Button>
                    </Popover>

                </Col>
                <Col span={12}>
                    <Popover content={<>
                        <CandidateList />
                    </>} trigger="hover">
                        <Button size="large" type="primary" onMouseEnter={() =>  dispatch(setProps({ att: "selectedJob", value: { ...job, index } }))} block>Show candidates</Button>
                    </Popover>

                </Col>
            </Row>



        </Card>
    )
}