import { RecentDAOList } from "@/components/dao/RecentDAOList";
import { P2PRecentJobs } from "@/components/job/p2p/P2PRecentJobs";
import { Divider, Space } from "antd";

import { Typography } from 'antd';

const { Title } = Typography;


export default function Index() {


    return (
  
            <Space style={{maxWidth: 1200}} wrap direction="vertical">
                <Title level={3}>{"Recent registered companies".toUpperCase()}</Title >
                <Divider />
                <RecentDAOList />
                <Divider/>
                <Title level={3}>{"Latest P2P jobs".toUpperCase()}</Title >
                <Divider/>
                <P2PRecentJobs />
            </Space>
     
    )
}