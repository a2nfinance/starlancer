import { Alert, Button, Collapse, Descriptions, Input, Modal, Space, Table, Tag } from "antd";
import { useEffect, useState } from "react";

import { CopyOutlined, WalletOutlined } from "@ant-design/icons";
import { useAppSelector } from "@//controller/hooks";
import { Stream } from "@/controller/stream/streamSlice";
import { cancelStream, getIncomingStreams, transferStream, withdrawStream } from "@/core/payment";
import { useAddress } from "@/hooks/useAddress";
import { useDate } from "@/hooks/useDate";
import { useStream } from "@/hooks/useStream";
import PaymentProcess from "./PaymentProcess";
import { useAccount } from "@starknet-react/core";


export const Incoming = () => {
    const { getUnlockEveryIn, getLocalString } = useDate();
    const { getShortAddress } = useAddress();
    const { getPrevilegeText } = useStream()
    const { account } = useAccount();
    const { incomingStreams } = useAppSelector(state => state.stream);
    const { withdrawStreamAction, cancelStreamAction, transferStreamAction } = useAppSelector(state => state.process);

    const [selectedStream, setSelectedStream] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRecipient, setNewRecipient] = useState("");


    const handleOk = () => {
        console.log(selectedStream, newRecipient);
        // transferStreamA(selectedStream, newRecipient);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const doWithdraw = (stream: Stream) => {
        // withdrawStreamAction(stream);
    }

    const handleTransfer = (stream: Stream) => {
        // setSelectedStream(stream);
        setIsModalOpen(true);
    }

    const colorMap = (pt: number) => {
        let color = "blue";
        if (!pt) return color;
        switch (parseInt(pt.toString())) {
            case 1:
                color = "blue"
                break;
            case 2:
                color = "geekblue";
                break;
            case 3:
                color = "purple";
                break
            default:
                break;
        }
        return color;
    }

    const statusMap = (status: number) => {
        let st = "active"
        if (!status) return st;
        switch (parseInt(status.toString())) {
            case 1:
                st = "active"
                break;
            case 2:
                st = "completed";
                break;
            case 3:
                st = "cancelled";
                break;
            default:
                break;
        }

        return st;

    }

    const columns = [
        {
            title: 'Sender',
            dataIndex: 'owner',
            key: 'owner',
            render: (_, record) => (

                <Button icon={<CopyOutlined />} type="primary" onClick={() => navigator.clipboard.writeText(record.owner)}>
                    {getShortAddress(record.owner)}
                </Button>

            )
        },
        {
            title: "Payout Progress",
            key: "progress",
            render: (_, record) => (
                <PaymentProcess stream={record} key={`payment-progress-${record.id}`} />
            )
        },
        {
            title: "Settings",
            key: "unlock_every",
            render: (dataIndex, record) => (
                <Collapse
                    items={[{
                        key: `${dataIndex}`,
                        label: `${record.unlock_amount_each_time} ETH / ${record.unlock_every} ${getUnlockEveryIn(record.unlock_every_type)}`,
                        children: <Descriptions column={1} size="small" style={{ maxWidth: 250 }}>
                            <Descriptions.Item label="Title">
                                {record.title}
                            </Descriptions.Item>
                            <Descriptions.Item label="Max Unlocked">
                                {record.unlock_number}
                            </Descriptions.Item>
                            <Descriptions.Item label="Start Date">
                                {getLocalString(record.start_date)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cancel Previlege">
                                {getPrevilegeText(record.cancel_previlege)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Transfer Previlege">
                                {getPrevilegeText(record.transfer_previlege)}
                            </Descriptions.Item>
                        </Descriptions>
                    }]}
                />

            )
        },
        {
            title: "Balance (ETH)",
            dataIndex: "balance",
            key: "balance",
            render: (dataIndex, record) => (

                <Collapse
                    items={[{
                        key: `${dataIndex}`,
                        label: `${record.total_fund - record.withdrew}`,
                        children: <Descriptions column={1} size="small" style={{ maxWidth: 150 }}>
                            <Descriptions.Item label="Balance">{record.total_fund - record.withdrew}</Descriptions.Item>
                            <Descriptions.Item label="Funds">{record.total_fund}</Descriptions.Item>
                            <Descriptions.Item label="Withdrew">{record.withdrew}</Descriptions.Item>
                        </Descriptions>
                    }]}
                />

            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (_, record) => (
                <Tag color={colorMap(record.status)}>{statusMap(record.status)}</Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space.Compact block>
                    <Button disabled={
                        record.status !== 1
                    } type="primary" onClick={() => doWithdraw(record)} loading={withdrawStreamAction}>Withdraw</Button>
                    <Button disabled={
                        record.status === 3 || [2, 3].indexOf(record.cancel_previlege) === -1
                    } type="default" onClick={() => cancelStream(record, account)} loading={cancelStreamAction}>Cancel</Button>
                    <Button disabled={
                        [2, 3].indexOf(record.status) !== -1 || [2, 3].indexOf(record.transfer_previlege) === -1
                    } type="default" onClick={() => handleTransfer(record)} loading={transferStreamAction}>Transfer</Button>
                </Space.Compact>
            )

        },
    ];


    useEffect(() => {
        if (account) {
            getIncomingStreams(account);
        }

    }, [account])

    return (
        <Space wrap direction="vertical">
            <Alert showIcon message="Kindly be aware that you can initiate a withdrawal only if the stream balance is greater than or equal to the unlocked amount minus the amount already withdrawn. If this condition is not met, it is advisable to contact the sender and request additional funding for the stream" type="success" />
            <Table
                pagination={{
                    pageSize: 10,
                    position: ["bottomCenter"]
                }}
                dataSource={incomingStreams.map((stream: Stream, index: number) => ({
                    ...stream,
                    key: index
                }))}
                columns={columns} />
            <Modal title="Transfer Stream" open={isModalOpen} onOk={handleOk} confirmLoading={transferStreamAction} onCancel={handleCancel}>
                <Input name="new_address" size="large" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} addonBefore={<WalletOutlined />} />
            </Modal>
        </Space>
    )
}

