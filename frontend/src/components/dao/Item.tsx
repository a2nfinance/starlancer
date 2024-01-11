import { Button, Card, Descriptions, Divider, Space, Tag } from 'antd';
import { useRouter } from 'next/router';
import { useAppDispatch } from '@/controller/hooks';
import { headStyle } from '@/theme/layout';
import { TESTNET_EXPLORER } from '@/core/config';
import { useAddress } from '@/hooks/useAddress';

export const Item = ({ index, dao }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { openLinkToExplorer, getShortAddress } = useAddress();
  return (
    <Card key={`dao-${index}`} title={dao.name} headStyle={headStyle} style={{ margin: 5}} extra={
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
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Description"}>{dao.short_description ? dao.short_description : "N/A"}</Descriptions.Item>
      </Descriptions>
      <Divider />
    </Card>
  );
}