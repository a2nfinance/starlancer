import { useAppSelector } from "@/controller/hooks";
import { createJob, createProject } from "@/core/c2p";
import { WHITELISTED_TOKENS } from "@/core/config";
import { accountAddressValid } from "@/helpers/data_validation";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Col, DatePicker, Divider, Form, Input, Modal, Row, Select, Space } from "antd"
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { AiOutlineWallet } from "react-icons/ai";
const { RangePicker } = DatePicker;
export const NewJob = () => {
    const router = useRouter();
    const { userRoles } = useAppSelector(state => state.daoDetail);
    const { account } = useAccount();
    const [openModal, setOpenModal] = useState(false);
    const { newJobAction } = useAppSelector(state => state.process);


    const onFinish = useCallback((values) => {
        createJob(
            values,
            account
        )
    }, [account?.address])
    return (
        <>
            <Space>
                <Button type="primary" disabled={!userRoles.is_job_manager} onClick={() => setOpenModal(true)}>New Job</Button><span>Only job managers can create jobs</span>
            </Space>
            <Modal title={"NEW JOB"} width={480} footer={false} open={openModal} onCancel={() => setOpenModal(false)} >
                <Form
                    name="new-job"

                    onFinish={onFinish}
                    layout="vertical">

                    <Alert type="info" message="Only job managers can create new job" />
                    <Divider />
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Title" name={"title"} rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Detail URL" name={"job_detail"} rules={[{ required: true, type: "url" }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                    </Row>


                    <Form.Item label="Short description" name={"short_description"} rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>


                    <Form.Item name={"date"} label="Open date & end date" rules={[{ required: true, message: 'Missing start date and end date' }]}>
                        <RangePicker size='large' showTime style={{ width: "100%" }} />
                    </Form.Item>


                    <Divider />
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Contract type" name={"job_type"} rules={[{ required: true }]}>
                                <Select size="large" options={[
                                    { label: "Hourly", value: "hourly" },
                                    { label: "Fixed price", value: "fixed_price" }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Amount" name={"amount"} rules={[{ required: true }]}>
                                <Input type="number" size="large" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Pay with token" name={"pay_by_token"} rules={[{ required: true }]}>
                    <Select size="large" options={Object.keys(WHITELISTED_TOKENS).map(token => {
                        return {
                            label: WHITELISTED_TOKENS[token].name,
                            value: token
                        }
                    })} />
                        </Form.Item>
                    <Divider />
                    <Button htmlType="submit" loading={newJobAction} disabled={!userRoles.is_job_manager} style={{ width: "100%" }} size="large" type="primary">Submit</Button>
                </Form>
            </Modal>
        </>
    )
}