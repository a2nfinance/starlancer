import { useAddress } from '@/hooks/useAddress';
import { headStyle } from '@/theme/layout';
import { Button, Card, Descriptions, Divider, Flex, Space } from 'antd';
import { useRouter } from 'next/router';
import { GoOrganization } from "react-icons/go";

export const Item = ({ index, dao }) => {
  const router = useRouter();
  const { openLinkToExplorer, getShortAddress } = useAddress();
  return (
    <Card key={`dao-${index}`} title={<Flex align='center' gap={5}><GoOrganization />{dao.name}</Flex>} headStyle={headStyle} style={{ margin: 5}} extra={
      <Space>
        <Button type='primary' onClick={() => router.push(`/dao/detail/${dao.address}`)}>View details</Button>
      </Space>

    }>
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Website"}>{dao.detail ? dao.detail : "N/A"}</Descriptions.Item>
        <Descriptions.Item label={"Social networks"}>{dao.social_networks ? dao.social_networks.map(sn => <a>{sn}</a>) : "N/A"}</Descriptions.Item>
        <Descriptions.Item label={"Address"}><Button onClick={() => openLinkToExplorer(dao.address)}>{getShortAddress(dao.address)}</Button></Descriptions.Item>
      </Descriptions>
      <Divider />
      <Descriptions layout={"vertical"} style={{minHeight: 100}} column={1}>
        <Descriptions.Item label={"Description"} >{dao.short_description ? dao.short_description : "N/A"}</Descriptions.Item>
      </Descriptions>
      <Divider />
    </Card>
  );
}