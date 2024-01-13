import { DAOList } from "@/components/dao/DAOList";
import { Divider, Typography } from "antd";

const { Title } = Typography;
export default function List() {
    return (
        <>
            <Title level={3}>{"Registered companies".toUpperCase()}</Title >
            <Divider />
            <DAOList />
        </>
    )
}