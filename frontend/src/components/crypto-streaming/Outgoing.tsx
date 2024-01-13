import { Alert, Button, Collapse, Descriptions, Divider, Input, Modal, Popover, Space, Table, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";

import { CopyOutlined, WalletOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import { useAppSelector } from "@/controller/hooks";
import { Stream } from "@/controller/stream/streamSlice";
import { cancelStream, fundStream, getOutgoingStreams, transferStream } from "@/core/payment";
import { useAddress } from "@/hooks/useAddress";
import { useDate } from "@/hooks/useDate";
import { useStream } from "@/hooks/useStream";
import PaymentProcess from "./PaymentProcess";
import { useAccount } from "@starknet-react/core";

export const Outgoing = () => {
    const { getUnlockEveryIn, getLocalString } = useDate();
    const { getShortAddress } = useAddress();
    const { getPrevilegeText } = useStream()
    const { account } = useAccount();
    const { outgoingStreams } = useAppSelector(state => state.stream);
    const [fundAmount, setFundAmount] = useState("");

    const [openFundStreamPopup, setOpenFundStreamPopup] = useState({});
    const { fundStreamAction, cancelStreamAction, transferStreamAction} = useAppSelector(state => state.process);


    const [selectedStream, setSelectedStream] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRecipient, setNewRecipient] = useState("");


    const handleOk = () => {
        console.log(selectedStream, newRecipient);
        // transferStream(selectedStream, newRecipient);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleTransfer = (stream: Stream) => {
        // setSelectedStream(stream);
        setIsModalOpen(true);
    }



    const handleOpenFundStreamPopupChange = (newOpen: boolean,
        //@ts-ignore
        streamId: string) => {
        setOpenFundStreamPopup({ ...openFundStreamPopup, ...{ streamId: newOpen } });
    };


    const doFund = useCallback((stream) => {
        // fundStream(stream, parseFloat(fundAmount));
    }, [fundAmount])

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

    const columns: ColumnsType<any> = [
        {
            title: "Recipient",
            dataIndex: "recipient",
            key: "recipient",
            render: (_, record) => (
                <Button icon={<CopyOutlined />} type="primary" onClick={() => navigator.clipboard.writeText(record.recipient)}>
                    {getShortAddress(record.recipient)}
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
                    <Popover
                        content={
                            <>
                                <Input name='adress' size="large" type="number" addonAfter={"ETH"} value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                                <Divider />
                                <Button disabled={
                                    record.status !== 1
                                } type='primary' onClick={() => doFund(record)} loading={fundStreamAction}>Send</Button>
                            </>
                        }
                        title="Amount"
                        trigger="click"
                        open={openFundStreamPopup[record.id]}
                        onOpenChange={() => handleOpenFundStreamPopupChange(!openFundStreamPopup[record.id], record.id)}
                    >
                        <Button disabled={
                            record.status !== 1
                        } type="primary">Fund</Button>
                    </Popover>

                    <Button disabled={
                        record.status === 3 || [1, 3].indexOf(record.cancel_previlege) === -1
                    } type="default" onClick={() => cancelStream(record, account)} loading={cancelStreamAction}>Cancel</Button>
                    <Button disabled={
                        [2,3].indexOf(record.status) !== -1 || [1, 3].indexOf(record.transfer_previlege) === -1
                    } type="default" onClick={() => handleTransfer(record)}>Transfer</Button>
                </Space.Compact>



            )

        },
    ];


    useEffect(() => {
        if (account) {
            getOutgoingStreams(account);
        }

    }, [account])


    return (
        <Space wrap direction="vertical">
            <Alert showIcon message="Please note that the recipient can proceed with a withdrawal only if the stream balance is equal to or greater than the unlocked amount minus the previously withdrawn amount. If this requirement is not met, it is necessary for you, as the sender, to provide additional funding for the stream." type="success" />
            <Table
                pagination={{
                    pageSize: 10,
                    position: ["bottomCenter"]
                }}
                dataSource={outgoingStreams}
                columns={columns} />
            <Modal title="Transfer Stream" open={isModalOpen} onOk={handleOk} confirmLoading={transferStreamAction} onCancel={handleCancel}>
                <Input name="new_address" size="large" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} addonBefore={<WalletOutlined />} />
            </Modal>
        </Space>
    )
}

