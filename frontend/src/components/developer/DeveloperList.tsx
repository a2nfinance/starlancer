import { useAppSelector } from "@/controller/hooks"
import { getDevelopers } from "@/core/c2p";
import { useAddress } from "@/hooks/useAddress";
import { Button, Space, Table } from "antd"
import { useEffect } from "react";
import { num } from "starknet";


export const DeveloperList = () => {
    const { members, userRoles } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();
    const columns = [
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => (
                <Button onClick={() => openLinkToExplorer(record.address)}>{getShortAddress(record.address)}</Button>
            )
        },

        {
            key: "action",
            title: "Actions",
            dataIndex: "action",
            render: (_, record, index) => (
                <Space>
                    <Button onClick={() => {}}>Show Starknet ID</Button>
                   
                    <Button type="primary" disabled={!userRoles.is_treasury_manager} onClick={() => {}}>
                        Payment
                    </Button>
                    <Button disabled={!userRoles.is_member_manager} onClick={() => {}}>
                        End contract
                    </Button>
                </Space>
            )
        }
    ]
    return (
        <Table
            columns={columns}
            dataSource={members.map(m => ({ address: num.toHexString(m) }))}
        />
    )
}
