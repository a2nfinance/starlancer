import { CandidatesForEmployer } from "@/components/job/p2p/CandidatesForEmployer";
import { NewTask } from "@/components/job/p2p/NewTask";
import { ViewTasks } from "@/components/job/p2p/ViewTasks";

import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { setProps } from "@/controller/p2p/p2pSlice";
import { getMyCreatedJobs } from "@/core/p2p";
import { headStyle } from "@/theme/layout";
import { useAccount } from "@starknet-react/core";
import { Button, Card, Divider, Modal, Popover, Space, Table, Tag } from "antd";
import { useCallback, useEffect, useState } from "react";

export default function CreatedJobs() {
    const { account } = useAccount();
    const { createdJobs } = useAppSelector(state => state.p2p);
    const dispatch = useAppDispatch();
    const [openCandidatesModal, setOpenCandidatesModal] = useState(false);
    const [openNewTaskModal, setOpenNewTaskModal] = useState(false);
    const [openTaskListModal, setOpenTaskListModal] = useState(false);

    const handleOpenCandidatesModal = useCallback((record, index) => {
        setOpenCandidatesModal(true);
        dispatch(setProps({ att: "selectedJob", value: { ...record, index } }))
    }, [])

    const closeCandidatesModal = () => {
        setOpenCandidatesModal(false)
    }

    const handleNewTask = useCallback((record, index) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedJob", value: { ...record, index } }))
        setOpenNewTaskModal(true);
    }, [])

    const handleCloseNewTaskModal = () => {
        setOpenNewTaskModal(false);
    }

    const handleOpenTaskList = useCallback((record, index) => {
        dispatch(setProps({ att: "selectedJob", value: { ...record, index } }))
        setOpenTaskListModal(true);
    }, [])

    const handleCloseTaskListModal = () => {
        setOpenTaskListModal(false);
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

                <Popover key={`popover-${index}`} content={
                    <Space direction="vertical">
                        <Button style={{ width: "100%" }}>View detail</Button>
                        <Divider />
                        <Button style={{ width: "100%" }} onClick={() => handleNewTask(record, index)}>New task</Button>
                        <Button style={{ width: "100%" }} onClick={() => handleOpenTaskList(record, index)}>View tasks</Button>
                        <Divider />
                        <Button onClick={() => handleOpenCandidatesModal(record, index)}>Show candidates</Button>
                        <Button style={{ width: "100%" }}>Change status</Button>
                    </Space>
                }>
                    <Button type="primary">actions</Button>
                </Popover>
            )
        },

    ]
    return (
        <Card title={"MY CREATED JOBS"} headStyle={headStyle}>
            <Table
                pagination={false}
                columns={columns}
                dataSource={createdJobs}
            />

            <Modal width={600} title={"JOB CANDIDATES"} open={openCandidatesModal} onCancel={closeCandidatesModal} footer={null} >

                <CandidatesForEmployer />
            </Modal>

            <Modal width={500} title={"NEW TASK"} open={openNewTaskModal} onCancel={handleCloseNewTaskModal} footer={null} >
                <NewTask />

            </Modal>

            <Modal width={"100%"} title={"TASK LIST"} open={openTaskListModal} onCancel={handleCloseTaskListModal} footer={null} >
                <ViewTasks />

            </Modal>
        </Card>
    )
}