import { useAppSelector } from "@/controller/hooks";
import { addWhiteListedContributor, fundDAO, getBalances, removeWhiteListedContributor } from "@/core/c2p";
import { WHITELISTED_TOKENS } from "@/core/config";
import { accountAddressValid } from "@/helpers/data_validation";
import { useAddress } from "@/hooks/useAddress";
import { useAccount } from "@starknet-react/core";
import { Button, Divider, Form, Input, Popover, Space, Table } from "antd";
import { useEffect } from "react";

export const TokenBalances = () => {
    const { balances, userRoles } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();
    const { account } = useAccount();
    const {addContributorAction, removeContributorAction} = useAppSelector(state => state.process);
    useEffect(() => {
        getBalances();
    }, [])

    const onFinish = (values, record) => {
        console.log(values, record);
        fundDAO(record.address, account, values.amount, record.decimals);
    }
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => (
                <Button onClick={() => openLinkToExplorer(record.address)}>{record.name}</Button>
            )
        },

        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'amount',
            render: (_, record) => (
                <Button>{record.symbol}</Button>
            )
        },
        {
            title: 'Balance',
            dataIndex: 'balance',
            key: 'balance',
            // render: (_, record) => (
            //     <Button onClick={() => openLinkToExplorer(record.address)}>{getShortAddress(record.address)}</Button>
            // )
        },
        {
            key: "action",
            title: "Actions",
            dataIndex: "action",
            render: (_, record, index) => (
                <Space>
                    <Popover key={`popover-${index}`} content={
                        <Form name={`fund-form-${index}`} layout="vertical" onFinish={(values) => onFinish(values, record)}>
                            <Form.Item label={"Amount"} name="amount" rules={[{ required: true }]}>
                                <Input size="large" type="number" />
                            </Form.Item>
                            <Button size="large" type="primary" htmlType="submit" >Send</Button>
                        </Form>} title="" trigger="hover">
                        <Button type="primary" onClick={() => { }}>
                            Fund
                        </Button>
                    </Popover>
                </Space>
            )
        }
    ]

    const onFinishAddContributor = (values) => {
        addWhiteListedContributor(values, account)
    }
    const onFinishRemoveContributor = (values) => {
        removeWhiteListedContributor(values, account);
    }
    return (
        <>
            <Space>

                <Popover key={`add-whitelisted-contributor`} content={
                    <Form name={`add-whitelisted-contributor`} layout="vertical" onFinish={onFinishAddContributor}>
                        <Form.Item label={"Address"} name="address" rules={[{ required: true }, accountAddressValid]}>
                            <Input size="large" />
                        </Form.Item>
                        <Button size="large" type="primary" loading={addContributorAction}  disabled={!userRoles.is_treasury_manager} htmlType="submit" >Submit</Button>
                    </Form>} title="" trigger="hover">
                    <Button type="primary" loading={addContributorAction} disabled={!userRoles.is_treasury_manager}>Add whitelisted contributor</Button>
                </Popover>

                <Popover key={`remove-whitelisted-contributor`} content={
                    <Form name={`remove-whitelisted-contributor`} layout="vertical" onFinish={onFinishRemoveContributor}>
                        <Form.Item label={"Address"} name="address" rules={[{ required: true }, accountAddressValid]}>
                            <Input size="large" />
                        </Form.Item>
                        <Button size="large" type="primary" loading={removeContributorAction}  disabled={!userRoles.is_treasury_manager} htmlType="submit" >Submit</Button>
                    </Form>} title="" trigger="hover">
                    <Button type="primary" loading={removeContributorAction} disabled={!userRoles.is_treasury_manager}>Remove whitelisted contributor</Button>
                </Popover>

                <span>Only whitelisted contributors can fund this DAO</span>
            </Space>
            <Divider />
            <Table
                columns={columns}
                pagination={false}
                dataSource={
                    Object.keys(WHITELISTED_TOKENS).map((key, index) => {
                        return {
                            decimals: WHITELISTED_TOKENS[key].decimals,
                            address: key,
                            name: WHITELISTED_TOKENS[key].name,
                            symbol: WHITELISTED_TOKENS[key].symbol,
                            balance: balances[index] ? (BigInt(balances[index]) / BigInt(10 ** WHITELISTED_TOKENS[key].decimals)).toString() : 0
                        }
                    })
                }
            />
        </>
    )
}