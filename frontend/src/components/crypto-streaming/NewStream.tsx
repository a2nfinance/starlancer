import { useAppSelector } from "@/controller/hooks";
import { createStream } from "@/core/payment";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Card, Col, Collapse, Descriptions, Divider, Form, Input, Row, Select, Space } from "antd";
import { AiOutlineWallet } from "react-icons/ai";

export const NewStream = () => {
    const { createStreamAction } = useAppSelector(state => state.process);
    const { account } = useAccount();
    const onFinish = (values: any) => {
        console.log('Received values of form:', values);
        createStream(values, account);
    };

    const previlegeOptions = [
        { label: "Sender", value: 1 },
        { label: "Recipient", value: 2 },
        { label: "Both", value: 3 },
        { label: "None", value: 4 }
    ];

    const payoutSettingsGuide = () => {
        return (
            <Descriptions title="Payout Settings" column={1} layout="vertical">
                <Descriptions.Item label="Address">Recipient Address</Descriptions.Item>
                <Descriptions.Item label="Amount">The amount of TOKEN that will be unlocked with each occurrence</Descriptions.Item>
                <Descriptions.Item label="Unlock Every (Release Frequency)">Refers to the duration (seconds) between two occurrences of unlocks.</Descriptions.Item>
                <Descriptions.Item label="Unlock Number">The maximum number of unlocks allowed.</Descriptions.Item>
                <Descriptions.Item label="Prepaid">The recipient will receive the token amount when the first unlocking event occurs.</Descriptions.Item>
                <Descriptions.Item label="Example">If the amount is 0.1, the release frequency is 5 seconds, and the number of unlocks is 4, it implies that every 5 seconds, the stream will unlock 0.1 GAS, and this process will occur 4 times.</Descriptions.Item>
            </Descriptions>
        )
    }
    return (
        <Form onFinish={onFinish} style={{ maxWidth: 600, margin: "auto" }} layout="vertical">
            <Alert
                message="Crypto Streaming"
                description="The token amount will be released according to a predetermined schedule. The recipient has the option to withdraw the tokens multiple times, with each withdrawal corresponding to a calculated amount of tokens being sent to the recipient."
                type="success"
                showIcon
            />

            <br />
      
            <Card title="General Settings" >
                <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Missing title' }]}>
                    <Input size={"large"} placeholder="Title" />
                </Form.Item>
                <Form.Item label="Start Date" name="start_date" rules={[{ required: true, message: 'Missing start time' }]}>
                    <Input size={"large"} type="datetime-local" />
                </Form.Item>
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item name={"cancel_previlege"} label="Cancel Previlege" initialValue={1}>
                            <Select size={"large"} options={previlegeOptions} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={"transfer_previlege"} label="Transfer Previlege" initialValue={1}>
                            <Select size={"large"} options={previlegeOptions} />
                        </Form.Item>
                    </Col>

                </Row>
            </Card>
            <Divider />
            <Collapse
                items={[{ key: '1', label: 'Payout Settings Guide', children: payoutSettingsGuide() }]}
            />
            <Divider />
            <Card title="Payout Settings">
                <Row gutter={12}>
                    <Col span={24}>
                        <Form.Item
                            label="Wallet Address"
                            name={'recipient'}
                            rules={[{ required: true, message: 'Missing address' }]}
                        >
                            <Input size='large' placeholder="Address" addonBefore={<AiOutlineWallet />} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item
                            label="Unlock Number"
                            name={'unlock_number'}
                            rules={[{ required: true, message: 'Missing Number of unlocks' }]}
                        >
                            <Input size='large' type="number" placeholder="Number of unlocks" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label={"Amount per Time"}
                            name={'unlock_amount_each_time'}
                            rules={[{ required: true, message: 'Missing amount' }]}
                        >
                            <Input size='large' type="number" placeholder="Amount" addonAfter="ETH" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Space direction="horizontal">
                            <Form.Item
                                label="Unlock Every"
                                name={'unlock_every'}
                                rules={[{ required: true, message: 'Missing frequency' }]}
                            >
                                <Input size='large' type="number" placeholder="Release frequency in seconds" />

                            </Form.Item>
                            <Form.Item label=" " initialValue={1} name={'unlock_every_type'}>
                                <Select size="large" options={[
                                    { label: "Seconds", value: 1 },
                                    { label: "Minutes", value: 2 },
                                    { label: "Hours", value: 3 },
                                    { label: "Days", value: 4 },
                                    { label: "Weeks", value: 5 },
                                    { label: "Months", value: 6 },
                                    { label: "Years", value: 7 },
                                ]} />
                            </Form.Item>
                        </Space>

                    </Col>



                    <Col span={12}>
                        <Form.Item
                            label={"Prepaid"}
                            name={'prepaid'}
                            initialValue={0}
                            rules={[{ required: true, message: 'Missing Prepaid Amount' }]}
                        >
                            <Input size='large' type="number" placeholder="Prepaid" addonAfter="ETH" />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>
            <Divider />
            <Form.Item>
                <Button type="primary" block size="large" loading={createStreamAction}>
                    Upcoming feature...
                </Button>


            </Form.Item>
        </Form>
    )
}