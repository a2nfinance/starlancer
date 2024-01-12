import { useAppSelector } from "@/controller/hooks"

import { acceptCandidate, getEmployerJobCandidates } from "@/core/p2p";
import { useAddress } from "@/hooks/useAddress";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Space, Table } from "antd"
import { useCallback, useEffect, useState } from "react"
import { num } from "starknet";

export const CandidatesForEmployer = () => {
    const { account } = useAccount();
    const { jobCandidates, selectedJob } = useAppSelector(state => state.p2p);
    const { openLinkToExplorer, getShortAddress } = useAddress();

    const [starknetID, setStarknetID] = useState("");
    const {acceptCandidateAction} = useAppSelector(state => state.process);

    useEffect(() => {
        getEmployerJobCandidates(account);
    }, [selectedJob.index, account?.address])
    const handleShowStarknetID = useCallback(async (address) => {
        try {
            let data = await fetch(`https://api.starknet.id/addr_to_domain?addr=${address}`);

            let domain = await data.json();
            setStarknetID(`Domain found: ${domain.domain}`)


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
                        title: "Actions",
                        dataIndex: "action",
                        render: (_, record, index) => (
                            <Space>
                                <Button onClick={() => handleShowStarknetID(record.address)}>Show Starknet ID</Button>
                                <Button type="primary" loading={acceptCandidateAction} disabled={selectedJob.creator !== account?.address} onClick={() => acceptCandidate(account, index)}>
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