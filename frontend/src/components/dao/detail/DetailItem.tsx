import { LinkOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Divider, Space, Tag } from 'antd';
import { useAppSelector } from '@/controller/hooks';
import { TESTNET_EXPLORER } from '@/core/config';
import { headStyle } from '@/theme/layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getDAODetail } from '@/core/c2p';
import { Item } from '../Item';
import { useAddress } from '@/hooks/useAddress';
import { UserRoles } from './UserRoles';


export const DetailItem = () => {
  const { detail: dao } = useAppSelector(state => state.daoDetail);
  const router = useRouter();
  const {openLinkToExplorer, getShortAddress} = useAddress();

  useEffect(() => {
      if (router.query["address"]) {
          getDAODetail(router.query["address"].toString());
      }
  }, [router.query["address"]])

  return (
    <Card key={`dao`} title={dao.name} headStyle={headStyle} style={{ margin: 5}} extra={
      <Space>
        <Button type='primary' onClick={() => router.push(`/dao/detail/${dao.address}`)}>View details</Button>
      </Space>

    }>
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Website"}>{dao.detail ? dao.detail : "N/A"}</Descriptions.Item>
        <Descriptions.Item label={"Social networks"}>{dao.social_networks ? dao.social_networks.map(sn => <a key={sn}>{sn}</a>) : "N/A"}</Descriptions.Item>
        <Descriptions.Item label={"Address"}><a onClick={() => openLinkToExplorer(dao.address)}>{getShortAddress(dao.address)}</a></Descriptions.Item>
      </Descriptions>
      <Divider />
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Description"}>{dao.short_description ? dao.short_description : "N/A"}</Descriptions.Item>
      </Descriptions>
      <Divider />
      <UserRoles/>
    </Card>
  );
}