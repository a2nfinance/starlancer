import { setProps } from "@/controller/dao/daoDetailSlice";
import { useAppDispatch, useAppSelector } from "@/controller/hooks";
import { applyJob, createJob, getJobs } from "@/core/c2p"
import { WHITELISTED_TOKENS } from "@/core/config";
import { useAddress } from "@/hooks/useAddress";
import { useRoles } from "@/hooks/useRoles";
import { useToken } from "@/hooks/useToken";
import { useAccount } from "@starknet-react/core"
import { Button, Descriptions, Divider, Modal, Space, Table, Tag } from "antd"

import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { ApplyModalContent } from "./ApplyModalContent";
import { CandidateList } from "./CandidateList";

export const JobList = () => {
    const { account } = useAccount();
    const router = useRouter();
    const { jobs, userRoles } = useAppSelector(state => state.daoDetail);
    const dispatch = useAppDispatch();
    const { isAllowApply } = useRoles();

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
        if (router.query["address"]) {
            getJobs(router.query["address"].toString())
        }
    }, [router.query["address"]])

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
                    <Button type="primary" disabled={!account || !isAllowApply(userRoles)} onClick={() => handleOpenApplyModal(record, index)}>Apply</Button>
                    <Button onClick={() => handleOpenCandidatesModal(record, index)}>Show candidates</Button>
                </Space>
            )
        },

    ]
    return (
        <>
            <Button onClick={() => createJob(router.query["address"]?.toString() || "", account)}>Create Job</Button>
            <Table
                columns={columns}
                dataSource={jobs}
            />

            <Modal width={400} title={"JOB DETAILS"} open={openApplyModal} onCancel={closeApplyModal} footer={null} >
                <ApplyModalContent />
                <Divider />
                <Button type="primary" size="large" style={{ width: "100%" }} onClick={() => applyJob(router.query["address"]?.toString() || "", account)}>Apply Now</Button>
            </Modal>

            <Modal width={600} title={"JOB CANDIDATES"} open={openCandidatesModal} onCancel={closeCandidatesModal} footer={null} >

                <CandidateList />
            </Modal>
        </>
    )
}