import { useAppSelector } from "@/controller/hooks"
import { acceptCandidate, getJobCandidates } from "@/core/c2p";
import { useAddress } from "@/hooks/useAddress";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Space, Table } from "antd"
import { useCallback, useEffect, useState } from "react"
import { num } from "starknet";

export const CandidateList = () => {
    const { account } = useAccount();
    const { jobCandidates, userRoles } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();

    const [starknetID, setStarknetID] = useState("");

    useEffect(() => {
        getJobCandidates();
    }, [])
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
                                <Button type="primary" disabled={!userRoles.is_member_manager} onClick={() => acceptCandidate(account, index)}>
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