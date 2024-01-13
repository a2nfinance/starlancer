import { P2PAllJobs } from "@/components/job/p2p/P2PAllJobs";
import { Divider, Typography } from "antd";
const { Title } = Typography;
export default function Index() {
   return (
      <>
         <Title level={3}>{"All P2P jobs".toUpperCase()}</Title >
         <Divider />
         <P2PAllJobs />
      </>

   )
}