import { Task } from "@/controller/dao/daoDetailSlice";
import { useAppSelector } from "@/controller/hooks";
import { changeTaskStatus, getJobTasks } from "@/core/p2p";
import { headStyle, panelStyle } from "@/theme/layout";
import { useAccount } from "@starknet-react/core";
import { Alert, Button, Card, Col, Collapse, Descriptions, Divider, Popover, Row, Space } from "antd";
import { useEffect } from "react";

export const ViewTasks = () => {
    const { jobTasks } = useAppSelector(state => state.p2p);
    const { account } = useAccount();
    const { changeTaskStatusAction } = useAppSelector(state => state.process);
    useEffect(() => {
        getJobTasks(account);
    }, [account?.address])

    const taskContent = (task: Task, index: number, prefix: string) => {
        return {
            key: `task-${prefix}-${index}`,
            label: task.title,
            children: <>

                <Descriptions layout="vertical" column={1}>
                    <Descriptions.Item label={'Short description'}>
                        {task.short_description}
                    </Descriptions.Item>
                    <Descriptions.Item label={'Start date'}>
                        {new Date(parseInt(task.start_date.toString()) * 1000).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label={'Deadline'}>
                        {new Date(parseInt(task.deadline.toString()) * 1000).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label={'Detail URL'}>
                        <Button onClick={() => window.open(task.task_detail, "_blank")}>{task.task_detail.substring(0, 31)}...</Button>
                    </Descriptions.Item>
                    <Descriptions.Item label={'Estimate'}>
                        {task.estimate.toString()} hour(s)
                    </Descriptions.Item>
                </Descriptions>
                <Divider />
                <Popover key={`popover-task-${prefix}-${index}`} content={
                    <Space direction="vertical">
                        {task.status === 'assigned' && <Button
                            loading={changeTaskStatusAction}

                            style={{ width: "100%" }}
                            onClick={() => changeTaskStatus(task.index || 0, "reviewing", account)}
                        >
                            Reviewing
                        </Button>}
                        {task.status === 'reviewing' && <Button
                            loading={changeTaskStatusAction}
                            style={{ width: "100%" }}
                            onClick={() => changeTaskStatus(task.index || 0, "complete", account)}
                        >
                            Complete</Button>}
                        {['assigned', 'reviewing'].indexOf(task.status) !== -1 && <Button
                            loading={changeTaskStatusAction}
                            style={{ width: "100%" }}
                            onClick={() => changeTaskStatus(task.index || 0, "cancel", account)}
                        >
                            Cancel
                        </Button>}
                    </Space>
                }>
                    <Button loading={changeTaskStatusAction} disabled={["assigned", "reviewing"].indexOf(task.status) === -1 } style={{ width: "100%" }} type="primary">Change task status</Button>
                </Popover>
            </>,
            style: panelStyle,

        }
    }
    return (
        <>
            <Alert type="info" message="Project managers, task managers, and code reviewers can change the task status" />
            <Divider />
            <Row gutter={6}>
                <Col span={6}>

                    <Card headStyle={headStyle} title={"Assigned Tasks"}>

                        <Collapse items={jobTasks.filter(task => task.status === 'assigned').map((task, index) => {

                            return taskContent(task, index, "assigned");
                        })} defaultActiveKey={['task-0']} onChange={() => { }} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card headStyle={headStyle} title={"Reviewing Tasks"}>
                        <Collapse items={jobTasks.filter(task => task.status === 'reviewing').map((task, index) => {

                            return taskContent(task, index, "reviewing");
                        })} defaultActiveKey={['task-0']} onChange={() => { }} />
                    </Card>

                </Col>
                <Col span={6}>
                    <Card headStyle={headStyle} title={"Completed Tasks"}>
                        <Collapse items={jobTasks.filter(task => task.status === 'completed').map((task, index) => {

                            return taskContent(task, index, "completed");
                        })} defaultActiveKey={['task-0']} onChange={() => { }} />
                    </Card>

                </Col>
                <Col span={6}>

                    <Card headStyle={headStyle} title={"Cancelled Tasks"}>
                        <Collapse items={jobTasks.filter(task => task.status === 'cancelled').map((task, index) => {

                            return taskContent(task, index, "cancelled");
                        })} defaultActiveKey={['task-0']} onChange={() => { }} />
                    </Card>

                </Col>
            </Row>
        </>

    )
}