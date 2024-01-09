import { useAppSelector } from "@/controller/hooks";
import { createProject, getDAOProjects } from "@/core/c2p";
import { LinkOutlined } from "@ant-design/icons";
import { useAccount } from "@starknet-react/core"
import { Button, Divider, Space, Table, Tag } from "antd";
import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";

export const ProjectList = () => {
    const { projects, userRoles } = useAppSelector(state => state.daoDetail);
    const { account } = useAccount();
    const router = useRouter();

    const handleCreateProject = useCallback(() => {
        createProject(
            router.query["address"]?.toString() || "",
            account
        )
    }, [account?.address])

    useEffect(() => {
        if (router.query["address"]) {
            getDAOProjects(router.query["address"].toString())
        }
    }, [router.query["address"]])
    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: "Detail",
            dataIndex: "project_detail",
            key: "project_detail",
            render: (_, record) => (
                <Button icon={<LinkOutlined />} onClick={() => window.open(record.project_detail, "_blank")}>view</Button>
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
            title: 'Actions',
            key: 'actions',
            render: (_, record, index) => (
                <Button type="primary" onClick={() => router.push(`/dao/detail/${router.query["address"]}/project/${index}`)}>View tasks</Button>
            )

        },
    ];
    return (
        <>
            <Space>
                <Button type="primary" disabled={!userRoles.is_treasury_manager} onClick={() => handleCreateProject()}>Create Project</Button><span>Only project managers can create projects</span>
            </Space>
            <Divider />
            <Table
                pagination={false}
                dataSource={projects}
                columns={columns}
            />
        </>
    )
}