import { useAppSelector } from "@/controller/hooks";
import { WHITELISTED_TOKENS } from "@/core/config";
import { doBatch } from "@/core/payment";
import { headStyle } from "@/theme/layout";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useAccount } from "@starknet-react/core";
import { Button, Card, Divider, Form, Input, Select, Space } from "antd";
import { useCallback } from "react";
import { AiOutlineWallet } from "react-icons/ai";

export const BatchForm = () => {
    const { createBatchPaymentAction } = useAppSelector(state => state.process);
    const { account } = useAccount();

    const onFinish = useCallback((values: any) => {
        doBatch(values, account);
    }, [])

    let tokenOptions: {label: string, value: string}[] = Object.keys(WHITELISTED_TOKENS).map((token)=> {
        return {
            label: WHITELISTED_TOKENS[token].name,
            value: token
        }
    })
    return (
        <Form onFinish={onFinish}
            layout="vertical"
            initialValues={{
                recipients: [
                    { address: "", amount: "" },
                    { address: "", amount: "" },
                    { address: "", amount: "" },
                ]
            }}>

            <Card size="default" headStyle={headStyle} title="RECIPIENTS">
                <Form.Item name={"token"} >
                    <Select size="large" options={tokenOptions} />
                </Form.Item>
                <Form.List name="recipients">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'address']}
                                        rules={[{ required: true, message: 'Missing address' }]}
                                    >

                                        <Input key={`input-auto-${key}`} addonBefore={<AiOutlineWallet />} size="large" placeholder="Recipient address" />

                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'amount']}
                                        rules={[{ required: true, message: 'Missing amount' }]}
                                    >
                                        <Input size='large' type="number" placeholder="Amount" />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" size="large" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Recipient
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

            </Card>
            <Divider />
            <Button size="large" disabled={!account} style={{ width: "100%" }} htmlType="submit" type="primary" loading={createBatchPaymentAction}>
                Transfer
            </Button>
        </Form>
    )
}