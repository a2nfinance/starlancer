import { useAppSelector } from "@/controller/hooks";
import { getUserRoles } from "@/core/c2p";
import { useAccount } from "@starknet-react/core";
import { Descriptions, Tag } from "antd"
import { useRouter } from "next/router"
import { useEffect } from "react";


export const UserRoles = () => {
    const router = useRouter();
    const { account } = useAccount();
    const { userRoles } = useAppSelector(state => state.daoDetail);
    useEffect(() => {
        if (router.query["address"]) {
            getUserRoles(router.query["address"].toString(), account);
        }
    }, [router.query["address"], account?.address])
    return (
        <Descriptions layout="vertical">
            <Descriptions.Item label="Your roles">
                {
                    userRoles.is_member && <Tag color="green">Developer</Tag>
                }
                {
                    userRoles.is_job_manager && <Tag color="green">Job Manager</Tag>
                }

                {
                    userRoles.is_treasury_manager && <Tag color="green">Treasury Manager</Tag>
                }

                {
                    userRoles.is_project_manager && <Tag color="green">Project Manager</Tag>
                }

                {
                    userRoles.is_member_manager && <Tag color="green">Project Manager</Tag>
                }
                {
                    (!userRoles.is_member && !userRoles.is_job_manager && !userRoles.is_treasury_manager && !userRoles.is_project_manager && !userRoles.is_member_manager) && <Tag color="green">N/A</Tag>
                }
            </Descriptions.Item>
        </Descriptions>
    )
}