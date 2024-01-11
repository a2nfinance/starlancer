import { Button, Card, Col, Divider, Form, Input, Radio, Row } from 'antd';
import { setDaoFormProps } from '@/controller/dao/daoFormSlice';
import { useAppDispatch, useAppSelector } from '@/controller/hooks';
import { headStyle } from '@/theme/layout';
import { KYC } from './Kyc';
import { useRouter } from 'next/router';
// import { getDAOByCreatorAndId, saveDAO } from '@/core/dao';
import { useEffect } from "react";
import { useAccount, useStarkAddress } from '@starknet-react/core';
import { useAddress } from '@/hooks/useAddress';

export const General = () => {
    const router = useRouter();
    const { id } = router.query
    const { kycForm } = useAppSelector(state => state.daoForm)
    const dispatch = useAppDispatch();
    const { address } = useAccount();
    const [form] = Form.useForm();
    const onFinish = (values: any) => {
        dispatch(setDaoFormProps({att: "kycForm", value: values}))
        dispatch(setDaoFormProps({att: "currentStep", value: 1}))
    };
    return (
        <Form
            form={form}
            name='general_form'
            initialValues={kycForm}
            onFinish={onFinish}
            layout='vertical'>
            <Card title="Company information" headStyle={headStyle} extra={
                <Button type="primary" htmlType='submit' size='large'>Next</Button>
            }>
                <Row gutter={12}>
                    <Col span={12}>
                        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Missing company name' }]}>
                            <Input size='large' />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="detail" label="Website" rules={[{ required: true, message: 'Incorrect website URL', type: "url" }]}>
                            <Input size='large' />
                        </Form.Item>
                    </Col>
                </Row>


                <Form.Item name="short_description" label="Short description" rules={[{ required: true, message: 'Missing owner' }]}>
                    <Input.TextArea size='large' />
                </Form.Item>


                {/* <Form.Item name="contract_name" label="Contract Name"
                    extra={"The contract name must not include spaces or special characters."}
                    rules={[
                        { pattern: new RegExp(/^[a-zA-Z0-9]*$/), message: "No Space or Special Characters Allowed" },
                        { required: true, message: 'Missing contract name' }
                    ]}>
                    <Input size='large' />
                </Form.Item> */}

            </Card>
            <Divider />
            <KYC />
        </Form>
    )
}
