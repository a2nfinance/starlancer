import { useAppSelector } from "@/controller/hooks";
import { newTask } from "@/core/p2p";

import { useAccount } from "@starknet-react/core";
import { Button, Col, DatePicker, Divider, Form, Input, Row } from "antd";
import { useCallback } from "react";
const { RangePicker } = DatePicker;
export const NewTask = () => {
    const {selectedJob} = useAppSelector(state => state.p2p)
    const {newTaskAction} = useAppSelector(state => state.process);
    const { account } = useAccount();
    const onFinish = useCallback((values: FormData) => {
        newTask(values, account);
    }, [account?.address])

    return (
        <Form name="newtask" onFinish={onFinish} layout="vertical">
            <Form.Item label="Title" name={"title"} rules={[{ required: true }]}>
                <Input size="large" />
            </Form.Item>
            <Form.Item label="Short description" name={"short_description"} rules={[{ required: true }]}>
                <Input size="large" />
            </Form.Item>
            <Row gutter={12}>
                <Col span={12}>
                    <Form.Item label="Detail URL" name={"task_detail"} rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item label="Estimate (hours)" name={"estimate"} rules={[{ required: true }]}>
                        <Input type="number" size="large" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name={"date"} label="Task start date & end date" rules={[{ required: true, message: 'Missing start date and end date' }]}>
                <RangePicker size='large' showTime style={{ width: "100%" }} />
            </Form.Item>

            <Divider />
            <Button htmlType="submit" loading={newTaskAction} disabled={account?.address !== selectedJob.creator} style={{ width: "100%" }} size="large" type="primary">Submit</Button>
        </Form>
    )
}