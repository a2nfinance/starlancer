import { P2PApplyModalContent } from "@/components/job/p2p/P2PApplyModalContent";
import { useAppDispatch, useAppSelector } from "@/controller/hooks"
import { setProps } from "@/controller/p2p/p2pSlice";
import { applyJob, getMyCreatedJobs } from "@/core/p2p";
import { headStyle } from "@/theme/layout";
import { useAccount } from "@starknet-react/core";
import { Button, Card, Divider, Modal, Space, Table, Tag } from "antd";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function CreatedJobs() {
    const { account } = useAccount();
    const { createdJobs } = useAppSelector(state => state.p2p);
    const dispatch = useAppDispatch();


    const [openApplyModal, setOpenApplyModal] = useState(false);
    const [openCandidatesModal, setOpenCandidatesModal] = useState(false);

    const handleOpenApplyModal = useCallback((record, index) => {
        setOpenApplyModal(true);
        dispatch(setProps({ att: "selectedJob", value: { ...record, index } }))
    }, [])

    const closeApplyModal = () => {
        setOpenApplyModal(false)
    }

    const handleOpenCandidatesModal = useCallback((record, index) => {
        setOpenCandidatesModal(true);
        dispatch(setProps({ att: "selectedJob", value: { ...record, index } }))
    }, [])

    const closeCandidatesModal = () => {
        setOpenCandidatesModal(false)
    }

    useEffect(() => {
        if (account?.address) {
            getMyCreatedJobs(account)
        }
    }, [account?.address])

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: "Start date",
            dataIndex: "start_date",
            key: "start_date",
            render: (_, record) => (
                new Date(parseInt(record.start_date) * 1000).toLocaleString()
            )
        },
        {
            title: "End date",
            dataIndex: "end_date",
            key: "end_date",
            render: (_, record) => (
                new Date(parseInt(record.end_date) * 1000).toLocaleString()
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (_, record) => (
                <Tag color={record.status ? "green" : "red"}>{record.status ? "active" : "closed"} </Tag>
            )
        },
        {
            title: "Actions",
            dataIndex: "action",
            key: "action",
            render: (_, record, index) => (
                <Space>
                    {/* <Button type="primary" disabled={!account || account?.address === record.creator} onClick={() => handleOpenApplyModal(record, index)}>Apply</Button> */}
                    <Button onClick={() => handleOpenCandidatesModal(record, index)}>Show candidates</Button>
                </Space>
            )
        },

    ]
    return (
        <Card title={"MY CREATED JOBS"} headStyle={headStyle}>

            {/* <NewJob />
            <Divider /> */}
            <Table
                pagination={false}
                columns={columns}
                dataSource={createdJobs}
            />

            {/* <Modal width={400} title={"JOB DETAILS"} open={openApplyModal} onCancel={closeApplyModal} footer={null} >
                <P2PApplyModalContent />
                <Divider />
                <Button type="primary" size="large" style={{ width: "100%" }} onClick={() => applyJob(account)}>Apply Now</Button>
            </Modal> */}

            <Modal width={600} title={"JOB CANDIDATES"} open={openCandidatesModal} onCancel={closeCandidatesModal} footer={null} >

                {/* <CandidateList /> */}
            </Modal>
        </Card>
    )
}