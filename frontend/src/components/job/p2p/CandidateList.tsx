import { useAppSelector } from "@/controller/hooks"
import { getJobCandidates } from "@/core/p2p";
import { getDomainByAddress } from "@/core/starknaming";

import { useAddress } from "@/hooks/useAddress";

import { Alert, Button, Space, Table } from "antd"
import { useCallback, useEffect, useState } from "react"
import { num } from "starknet";

export const CandidateList = () => {
    const { jobCandidates, selectedJob } = useAppSelector(state => state.p2p);
    const { openLinkToExplorer, getShortAddress } = useAddress();

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
                        title: "Action",
                        dataIndex: "action",
                        render: (_, record, index) => (
                            <Space>
                                <Button onClick={() => getDomainByAddress(record.address)}>Show Starknet ID</Button>
                            </Space>
                        )
                    }
                ]}
            />
        </>

    )
}