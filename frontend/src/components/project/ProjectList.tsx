import { setProps } from "@/controller/dao/daoDetailSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { createProject, getDAOProjects, getDevelopers } from "@/core/c2p";
import { useAddress } from "@/hooks/useAddress";
import { LinkOutlined } from "@ant-design/icons";
import { useAccount } from "@starknet-react/core";
import { Button, Divider, Modal, Popover, Space, Table, Tag } from "antd";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { NewTask } from "./actions/NewTask";
import { ViewTasks } from "./actions/ViewTasks";

export const ProjectList = () => {
    const { projects, userRoles } = useAppSelector(state => state.daoDetail);
    const dispatch = useAppDispatch();
    const { account } = useAccount();
    const router = useRouter();
    const { getShortAddress, openLinkToExplorer } = useAddress();

    const [openNewTaskModal, setOpenNewTaskModal] = useState(false);
    const [openTaskListModal, setOpenTaskListModal] = useState(false);

    const handleCreateProject = useCallback(() => {
        createProject(
            router.query["address"]?.toString() || "",
            account
        )
    }, [account?.address])

    const handleNewTask = useCallback((record, index) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProject", value: { ...record, index } }))
        setOpenNewTaskModal(true);
    }, [])

    const handleCloseNewTaskModal = () => {
        setOpenNewTaskModal(false);
    }

    const handleOpenTaskList = useCallback((record, index) => {
        dispatch(setProps({ att: "selectedProject", value: { ...record, index } }))
        setOpenTaskListModal(true);
    }, [])

    const handleCloseTaskListModal = () => {
        setOpenTaskListModal(false);
    }
    const handleAddCodeReviewers = useCallback((record) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProject", value: record }))
    }, [])

    const handleAddTaskManagers = useCallback((record) => {
        // open modal
        // set selected project
        dispatch(setProps({ att: "selectedProject", value: record }))
    }, [])

    useEffect(() => {
        if (router.query["address"]) {
            getDAOProjects(router.query["address"].toString())
            getDevelopers(router.query["address"].toString());

        }
    }, [router.query["address"]])
    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: "PM",
            dataIndex: "creator",
            key: "creator",
            render: (_, record) => (
                // <Button icon={<LinkOutlined />} onClick={() => window.open(record.project_detail, "_blank")}>view</Button>
                <Button onClick={() => record.creator === account?.address ? {} : openLinkToExplorer(record.creator)}>
                    {record.creator === account?.address ? "You're PM" : getShortAddress(record.creator)}
                </Button>
            )
        },
        {
            title: "Start date",
            dataIndex: "start_date",
            key: "start_date",
            render: (_, record) => (
                new Date(parseInt(record.start_date) * 1000).toLocaleString()
            )
        },
        // {
        //     title: "End date",
        //     dataIndex: "end_date",
        //     key: "end_date",
        //     render: (_, record) => (
        //         new Date(parseInt(record.end_date) * 1000).toLocaleString()
        //     )
        // },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (_, record) => (
                <Tag color={record.status ? "green" : "red"}>{record.status ? "active" : "closed"} </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                <Popover key={`popover-${index}`} content={
                    <Space direction="vertical">
                        <Button style={{ width: "100%" }}>View detail</Button>
                        <Divider />
                        <Button style={{ width: "100%" }} onClick={() => handleNewTask(record, index)}>New task</Button>
                        <Button style={{ width: "100%" }} onClick={() => handleOpenTaskList(record, index)}>View tasks</Button>
                        <Divider />
                        <Button style={{ width: "100%" }}>Add task managers</Button>
                        <Button style={{ width: "100%" }}>Add code reviewers</Button>
                        <Button style={{ width: "100%" }}>Change status</Button>
                        <Button style={{ width: "100%" }}>Update project</Button>
                    </Space>
                }>
                    <Button type="primary">actions</Button>
                </Popover>
            )

        },
    ];
    return (
        <>
            <Space>
                <Button type="primary" disabled={!userRoles.is_project_manager} onClick={() => handleCreateProject()}>Create Project</Button><span>Only project managers can create projects</span>
            </Space>
            <Divider />
            <Table
                pagination={false}
                dataSource={projects}
                columns={columns}
            />
            <Modal width={500} title={"NEW TASK"} open={openNewTaskModal} onCancel={handleCloseNewTaskModal} footer={null} >
                <NewTask />

            </Modal>

            <Modal width={"100%"} title={"TASK LIST"} open={openTaskListModal} onCancel={handleCloseTaskListModal} footer={null} >
                <ViewTasks />

            </Modal>
        </>
    )
}