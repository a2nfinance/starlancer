import { useAppSelector } from "@/controller/hooks"
import { getJobCandidates } from "@/core/p2p";

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

    const handleShowStarknetID = useCallback(async (address) => {
        try {
            // let data = await fetch(`https://api.starknet.id/addr_to_domain?addr=${address}`);

            // let domain = await data.json();
            // setStarknetID(`Domain found: ${domain.domain}`)


        } catch (e) {
            setStarknetID("No domain found");
        }

    }, [])
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
                                <Button onClick={() => handleShowStarknetID(record.address)}>Show Starknet ID</Button>
                            </Space>
                        )
                    }
                ]}
            />
        </>

    )
}