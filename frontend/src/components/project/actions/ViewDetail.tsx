import { useAppSelector } from "@/controller/hooks";
import { getDomainByAddress } from "@/core/starknaming";
import { useAddress } from "@/hooks/useAddress";
import { Button, Descriptions, Space } from "antd";

export const ViewDetail = () => {

    const { selectedProject } = useAppSelector(state => state.daoDetail);
    const { openLinkToExplorer, getShortAddress } = useAddress();
    return (
        <>
            <Descriptions column={1} layout="vertical">
                <Descriptions.Item label={"Title"}>
                    {selectedProject.title}
                </Descriptions.Item>
                <Descriptions.Item label={"Short description"}>
                    {selectedProject.short_description}
                </Descriptions.Item>
            </Descriptions>
            <Descriptions layout="vertical" column={2}>
                <Descriptions.Item label={"Start date"}>
                    {new Date(parseInt(selectedProject.start_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label={"End date"}>
                    {new Date(parseInt(selectedProject.end_date.toString()) * 1000).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label={"Project manager"}>
                    <Space>
                        <Button onClick={() => openLinkToExplorer(selectedProject.creator)}>{getShortAddress(selectedProject.creator)}</Button>
                        <Button onClick={() => getDomainByAddress(selectedProject.creator)}>Show StarknetID</Button>
                    </Space>
                </Descriptions.Item>

            </Descriptions>

        </>

    )
}