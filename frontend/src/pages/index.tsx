import { WalletBar } from "@/components/common/WalletBar";
import { DAOList } from "@/components/dao/DAOList";
import { createDAO, getDAOs } from "@/core/c2p";
import { useAccount } from "@starknet-react/core";
import { Button, Card, Col, Image, Row, Space } from "antd";

import { Typography } from 'antd';
import { useRouter } from "next/router";

const { Title, Text } = Typography;
const { Meta } = Card;

export default function Index() {
    const router = useRouter();
    const { account } = useAccount();

    return (
  
            <Space>

                <DAOList />
            </Space>
     
    )
}