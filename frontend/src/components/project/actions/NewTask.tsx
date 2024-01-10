import { useAppSelector } from "@/controller/hooks";
import { getProjectRoles, newTask } from "@/core/c2p";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Col, DatePicker, Descriptions, Divider, Form, Input, Row, Select, Space, Tag } from "antd"
import moment from "moment";
import { useCallback, useEffect } from "react";
import { num } from "starknet";
const { RangePicker } = DatePicker;
export const NewTask = () => {
    const { members, projectRoles } = useAppSelector(state => state.daoDetail);
    const { account } = useAccount();
    const onFinish = useCallback((values: FormData) => {
        console.log(values);
        newTask(values, account);
    }, [account?.address])

    useEffect(() => {
        getProjectRoles(account);
    }, [account?.address])
    return (
        <Form name="newtask" onFinish={onFinish} layout="vertical">
            <Descriptions>
                <Descriptions.Item label={"Your project roles"}>
                    {projectRoles.is_task_manager && <Tag color="green">Task manager</Tag>}
                    {projectRoles.is_code_reviewer && <Tag color="green">Code reviewer</Tag>}
                    {(!projectRoles.is_code_reviewer && !projectRoles.is_task_manager) && <Tag color="green">N/A</Tag>}
                </Descriptions.Item>

            </Descriptions>
            <Alert type="info" message="Only task managers or the project creator can create new task" />
            <Divider />
            <Form.Item name={"developer"} label="Developer" rules={[{ required: true, message: 'Missing start date and end date' }]}>
                <Select size="large" options={
                    members.map((m, index) => ({
                        label: num.toHexString(m),
                        value: num.toHexString(m)
                    }))
                } />
            </Form.Item>
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
            <Button htmlType="submit" disabled={!projectRoles.is_task_manager} style={{ width: "100%" }} size="large" type="primary">Submit</Button>
        </Form>
    )
}