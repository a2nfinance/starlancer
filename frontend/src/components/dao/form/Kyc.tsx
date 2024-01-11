import { Card, Col, Form, Input, Radio, Row } from 'antd';
import { useAppSelector } from '@/controller/hooks';
import { headStyle } from '@/theme/layout';

export const KYC = () => {
    return (
        <Card title="Social networks" headStyle={headStyle}>
            <Row gutter={12}>
                <Col span={12}>
                    <Form.Item name="discord" label="Discord" rules={[{ required: false, type: "url" }]}>
                        <Input size='large' />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="twitter" label="Twitter" rules={[{ required: false, type: "url" }]}>
                        <Input size='large' />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={12}>
                <Col span={12}>
                    <Form.Item name="telegram" label="Telegram" rules={[{ required: false, type: "url" }]}>
                        <Input size='large' />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="facebook" label="Facebook" rules={[{ required: false, type: "url" }]}>
                        <Input size='large' />
                    </Form.Item>
                </Col>
            </Row>

        </Card>
    )
}
