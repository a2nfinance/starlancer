
import { Button, Card, Descriptions, Divider, Form, Space, Tag } from "antd";
import { useRouter } from "next/router";

import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { useAddress } from "@/hooks/useAddress";
import { headStyle } from "@/theme/layout";
import { TESTNET_EXPLORER } from "@/core/config";
import { setDaoFormProps } from "@/controller/dao/daoFormSlice";
import { createDAO } from "@/core/c2p";
import { useAccount } from "@starknet-react/core";

export const ReviewAndApprove = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const {account} = useAccount();
    const { kycForm, treasuryManagersForm, memberManagersForm, projectManagersForm, jobManagersForm } = useAppSelector(state => state.daoForm);
    const { getShortAddress, openLinkToExplorer } = useAddress();
    const {createDAOAction} = useAppSelector(state => state.process)
    return (
        <Card title="Summary" headStyle={headStyle} style={{maxWidth: 500}} extra={
            <Button type="primary" htmlType='button' onClick={() => dispatch(setDaoFormProps({ att: "currentStep", value: 4 }))} size='large'>Back</Button>
        }>
            <Descriptions title={"General Info"} column={2} layout="vertical">
                <Descriptions.Item label="Name">
                    {kycForm.name}
                </Descriptions.Item>
                <Descriptions.Item label="Website">
                    {kycForm.detail}
                </Descriptions.Item>

            </Descriptions>
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label="Short description">
                    {kycForm.short_description}
                </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label="Treasury managers">
                    <Space>
                        {treasuryManagersForm.managers.map(m => {
                            return (
                                <Button onClick={() => openLinkToExplorer(m.address)}>{getShortAddress(m.address)}</Button>
                            )
                        })}
                    </Space>
                </Descriptions.Item>

                <Descriptions.Item label="Developer managers">
                    <Space>
                        {memberManagersForm.managers.map(m => {
                            return (
                                <Button onClick={() => openLinkToExplorer(m.address)}>{getShortAddress(m.address)}</Button>
                            )
                        })}
                    </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Project managers">
                    <Space>
                        {projectManagersForm.managers.map(m => {
                            return (
                                <Button onClick={() => openLinkToExplorer(m.address)}>{getShortAddress(m.address)}</Button>
                            )
                        })}
                    </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Job managers">
                    <Space>
                        {jobManagersForm.managers.map(m => {
                            return (
                                <Button onClick={() => openLinkToExplorer(m.address)}>{getShortAddress(m.address)}</Button>
                            )
                        })}
                    </Space>
                </Descriptions.Item>

            </Descriptions>

            <Button loading={createDAOAction} type="primary" size="large" block onClick={() => createDAO(account)}>
                Submit
            </Button>
        </Card>
    )
}
