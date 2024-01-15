import { useAppSelector } from "@/controller/hooks"
import { acceptCandidate, getJobCandidates } from "@/core/c2p";
import { getDomainByAddress } from "@/core/starknaming";
import { useAddress } from "@/hooks/useAddress";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Space, Table } from "antd"
import { useCallback, useEffect, useState } from "react"
import { num } from "starknet";

export const CandidateList = () => {
    const { account } = useAccount();
    const { jobCandidates, userRoles, selectedJob } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();
    const { acceptCandidateAction } = useAppSelector(state => state.process);

    const [starknetID, setStarknetID] = useState("");

    useEffect(() => {
        getJobCandidates();
    }, [selectedJob.index])
    return (
        <>
            {starknetID && <Alert type="info" message={starknetID} />
            }
            <Table
                pagination={false}
                dataSource={jobCandidates.map(candiate => ({ address: num.toHexString(candiate) }))}
                columns={[
                    {
                        key: "address",
                        title: "Candiate",
                        dataIndex: "address",
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
                                <Button onClick={() => getDomainByAddress(record.address)}>Show Starknet ID</Button>
                                <Button type="primary" loading={acceptCandidateAction} disabled={!userRoles.is_member_manager} onClick={() => acceptCandidate(account, index)}>
                                    Accept
                                </Button>
                            </Space>
                        )
                    }
                ]}
            />
        </>

    )
}