import { useAppSelector } from "@/controller/hooks";
import { getProjectRoles } from "@/core/c2p";
import { headStyle } from "@/theme/layout"
import { useAccount } from "@starknet-react/core";
import { Alert, Card, Col, Descriptions, Divider, Row, Tag } from "antd"
import { useEffect } from "react";

export const ViewTasks = () => {
    const { members, projectRoles } = useAppSelector(state => state.daoDetail);
    const { account } = useAccount();
    useEffect(() => {
        getProjectRoles(account);
    }, [account?.address])

    return (
        <>
         <Descriptions>
                <Descriptions.Item label={"Your project roles"}>
                    {projectRoles.is_task_manager && <Tag color="green">Task manager</Tag>}
                    {projectRoles.is_code_reviewer && <Tag color="green">Code reviewer</Tag>}
                    {(!projectRoles.is_code_reviewer && !projectRoles.is_task_manager) && <Tag color="green">N/A</Tag>}
                </Descriptions.Item>

            </Descriptions>
            <Alert type="info" message="Project managers, task managers, and code reviewers can change the task status" />
            <Divider />
        <Row gutter={6}>
            <Col span={6}>

                <Card headStyle={headStyle}  title={"Assigned Tasks"}>
                </Card>
            </Col>
            <Col span={6}>
                <Card headStyle={headStyle} title={"Reviewing Tasks"}>

                </Card>

            </Col>
            <Col span={6}>
                <Card headStyle={headStyle} title={"Completed Tasks"}>

                </Card>

            </Col>
            <Col span={6}>

                <Card headStyle={headStyle} title={"Cancelled Tasks"}>

                </Card>

            </Col>
        </Row>
        </>
        
    )
}