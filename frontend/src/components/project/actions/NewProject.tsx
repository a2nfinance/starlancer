import { useAppSelector } from "@/controller/hooks";
import { createProject } from "@/core/c2p";
import { accountAddressValid } from "@/helpers/data_validation";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Col, DatePicker, Divider, Form, Input, Modal, Row, Space } from "antd"
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { AiOutlineWallet } from "react-icons/ai";
const { RangePicker } = DatePicker;
export const NewProject = () => {
    const router = useRouter();
    const { userRoles } = useAppSelector(state => state.daoDetail);
    const { account } = useAccount();
    const [openNewProjectModal, setOpenNewProjectModal] = useState(false);
    const {createProjectAction} = useAppSelector(state => state.process);


    const onFinish = useCallback((values) => {
        createProject(
            values,
            account
        )
    }, [account?.address])
    return (
        <>
            <Space>
                <Button type="primary" disabled={!userRoles.is_project_manager} onClick={() => setOpenNewProjectModal(true)}>Create Project</Button><span>Only project managers can create projects</span>
            </Space>
            <Modal title={"NEW PROJECT"} width={480} footer={false} open={openNewProjectModal} onCancel={() => setOpenNewProjectModal(false)} >
                <Form 
                    name="new-project"
                    initialValues={{
                        task_managers: [
                            {address: ""}
                        ],
                        code_reviewers: [
                            {address: ""}
                        ]
                    }}
                 onFinish={onFinish} 
                 layout="vertical">

                    <Alert type="info" message="Only project managers can create new project" />
                    <Divider />
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item label="Title" name={"title"} rules={[{ required: true }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Detail URL" name={"project_detail"} rules={[{ required: true, type: "url" }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Short description" name={"short_description"} rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>


                    <Form.Item name={"date"} label="Task start date & end date" rules={[{ required: true, message: 'Missing start date and end date' }]}>
                        <RangePicker size='large' showTime style={{ width: "100%" }} />
                    </Form.Item>

                    <Divider />

                    <Form.List name="task_managers">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Row key={key} style={{ display: 'flex', marginBottom: 8 }} gutter={12}>
                                        <Col span={20}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'address']}
                                                rules={[{ required: true, message: 'Missing address' }, accountAddressValid]}
                                            >
                                                <Input addonBefore={<AiOutlineWallet />} size='large' placeholder="account address" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Col>

                                    </Row>
                                ))}

                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add task manager
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                    <Divider />
                    <Form.List name="code_reviewers">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Row key={key} style={{ display: 'flex', marginBottom: 8 }} gutter={12}>
                                        <Col span={20}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'address']}
                                                rules={[{ required: true, message: 'Missing address' }, accountAddressValid]}
                                            >
                                                <Input addonBefore={<AiOutlineWallet />} size='large' placeholder="account address" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={4}>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Col>

                                    </Row>
                                ))}

                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add code reviewer
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                    <Divider />
                    <Button htmlType="submit" loading={createProjectAction} disabled={!userRoles.is_project_manager} style={{ width: "100%" }} size="large" type="primary">Submit</Button>
                </Form>
            </Modal>
        </>
    )
}