import { useAppDispatch, useAppSelector } from "@/controller/hooks"
import { getDevContract, getDevelopers, getPaymentAmount } from "@/core/c2p";
import { WHITELISTED_TOKENS } from "@/core/config";
import { useAddress } from "@/hooks/useAddress";
import { Button, Descriptions, Modal, Space, Table, Tag } from "antd"
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { num } from "starknet";
import { ViewContract } from "./actions/ViewContract";
import { getRateFee } from "@/core/platform";
import { Payment } from "./actions/Payment";
import { setProps } from "@/controller/dao/daoDetailSlice";


export const DeveloperList = () => {
    const { members, userRoles, devContract, selectedDevIndex } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();
    const [openViewContractModal, setOpenViewContractModal] = useState(false);
    const [openPaymentModal, setOpenPaymentModal] = useState(false);
    const dispatch = useAppDispatch();
    const handleOpenViewContract = useCallback((index: number) => {
        getDevContract(index);
        setOpenViewContractModal(true);
    }, [])

    const handleCancelViewContract = () => {
        setOpenViewContractModal(false);
    }

    const handleOpenPayment = useCallback((index) => {
        dispatch(setProps({att: "selectedDevIndex", value: index}));
        getPaymentAmount();
        setOpenPaymentModal(true);
    }, [selectedDevIndex])

    const handleClosePayment = () => {
        setOpenPaymentModal(false);
    }
    useEffect(() => {
        getRateFee();
    }, [])
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
                    <Button onClick={() => { }}>Show Starknet ID</Button>

                    <Button type="primary" disabled={!userRoles.is_treasury_manager} onClick={() => handleOpenPayment(index)}>
                        Payment
                    </Button>
                    <Button disabled={!userRoles.is_member_manager} onClick={() => handleOpenViewContract(index)}>
                        View contract
                    </Button>
                    <Button disabled={!userRoles.is_member_manager} onClick={() => { }}>
                        End contract
                    </Button>
                </Space>
            )
        }
    ]
    return (
        <>
            <Table
                columns={columns}
                dataSource={members.map(m => ({ address: num.toHexString(m) }))}
            />
            <Modal width={400} title={"DEV CONTRACT"} open={openViewContractModal} onCancel={handleCancelViewContract} footer={false}>
                <ViewContract />
            </Modal>

            <Modal width={300} title={"PAYMENT"} open={openPaymentModal} onCancel={handleClosePayment} footer={false}>
                <Payment />
            </Modal>
        </>

    )
}
