import { LinkOutlined } from '@ant-design/icons';
import { Button, Card, Descriptions, Divider, Flex, Space, Tag } from 'antd';
import { useAppSelector } from '@/controller/hooks';
import { TESTNET_EXPLORER } from '@/core/config';
import { headStyle } from '@/theme/layout';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getDAODetail } from '@/core/c2p';
import { Item } from '../Item';
import { useAddress } from '@/hooks/useAddress';
import { UserRoles } from './UserRoles';
import { GoOrganization } from 'react-icons/go';


export const DetailItem = () => {
  const { detail: dao } = useAppSelector(state => state.daoDetail);
  const router = useRouter();
  const { openLinkToExplorer, getShortAddress } = useAddress();

  useEffect(() => {
    if (router.query["address"]) {
      getDAODetail(router.query["address"].toString());
    }
  }, [router.query["address"]])
  const socialNetworks = [
    "Twitter",
    "Telegram",
    "Discord",
    "Facebook"
  ]
  return (
    <Card key={`dao`} title={<Flex align='center' gap={5}><GoOrganization />{dao.name}</Flex>} headStyle={headStyle} style={{ margin: 5 }}>
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Website"}>{dao.detail ? dao.detail : "N/A"}</Descriptions.Item>
        <Descriptions.Item label={"Social networks"}>
          <Space wrap>
            {
              dao.social_networks.length ? dao.social_networks.map(
                (sn, index) => sn ? <Button icon={<LinkOutlined />} key={sn} onClick={() => window.open(sn, "_blank")}>{
                  sn ? socialNetworks[index] : ""
                }</Button> : <></>
              ) : "N/A"}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={"Address"}><Button onClick={() => openLinkToExplorer(dao.address)}>{getShortAddress(dao.address)}</Button></Descriptions.Item>
      </Descriptions>
      <Divider />
      <Descriptions layout={"vertical"} column={1}>
        <Descriptions.Item label={"Description"}>{dao.short_description ? dao.short_description : "N/A"}</Descriptions.Item>
      </Descriptions>
      <Divider />
      <UserRoles />
    </Card>
  );
}