import {
    AppstoreOutlined,
    GithubOutlined,
    HomeOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons';

import { Button, Form, Image, Layout, Menu, Space, theme } from 'antd';
import { useRouter } from 'next/router';
import { AiOutlineAppstoreAdd, AiOutlineFileAdd } from "react-icons/ai";
import { FaSuperscript } from "react-icons/fa";
import { GoProjectRoadmap } from "react-icons/go";
import { GrDocumentTime } from "react-icons/gr";
import { RiRefund2Line, RiTaskLine } from "react-icons/ri";

import React, { useState } from "react";
import { WalletBar } from './common/WalletBar';
// import AutoSearch from './common/AutoSearch';
// import { ConnectButton } from './common/ConnectButton';
const { Header, Sider, Content, Footer } = Layout;

interface Props {
    children: React.ReactNode | React.ReactNode[];
}

export const LayoutProvider = (props: Props) => {
    const [collapsed, setCollapsed] = useState(false);
    const router = useRouter();
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} onCollapse={() => setCollapsed(!collapsed)} collapsed={collapsed} style={{ background: colorBgContainer }}>
                <div style={{ height: 50, margin: 16 }}>
                    {
                        !collapsed ? <Image src={"/logo.png"} alt="dpay" preview={false} width={150} /> : <Image src={"/ICON.png"} alt="dpay" preview={false} width={50} height={50} />
                    }
                </div>

                <Menu
                    style={{ fontWeight: 600 }}
                    inlineIndent={10}
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    items={[
                        {
                            key: '1',
                            icon: <HomeOutlined />,
                            label: "Home",
                            onClick: () => router.push("/")
                        },
                        {
                            key: '2',
                            icon: <AppstoreOutlined />,
                            label: "Companies",
                            onClick: () => router.push("/dao/list")
                        },
                        {
                            key: '3',
                            icon: <RiTaskLine />,
                            label: "Conpany Register",
                            onClick: () => router.push("/dao/new")
                        },
                        { type: 'divider' },
                        {
                            key: '4',
                            type: "group",
                            label: !collapsed ? 'My Account' : '',
                            children: [
                                {
                                    key: '4.1',
                                    label: "Jobs",
                                    icon: <AiOutlineAppstoreAdd />,
                                    onClick: () => router.push("/dao/new")
                                },
                                {
                                    key: '4.2',
                                    label: "New job",
                                    icon: <AiOutlineFileAdd />,
                                    onClick: () => router.push("/project/new")
                                },
                            ]
                        },
                        { type: 'divider' },
                        {
                            key: '5',
                            type: "group",
                            label: !collapsed ? 'Payment Tools' : '',
                            children: [
                                {
                                    key: '5.1',
                                    label: "Crypto streaming",
                                    icon: <AiOutlineAppstoreAdd />,
                                    onClick: () => router.push("/dao/new")
                                },
                                {
                                    key: '5.2',
                                    label: "Locked time payment",
                                    icon: <AiOutlineFileAdd />,
                                    onClick: () => router.push("/project/new")
                                },
                            ]
                        },
                        { type: "divider" },
                        {
                            key: "6",
                            type: "group",
                            label: !collapsed ? 'Starlancer v0.0.1' : "",
                            children: [
                                {
                                    key: '6.1',
                                    icon: <FaSuperscript />,
                                    label: 'Twitter',
                                    onClick: () => window.open("https://twitter.com/starlancer_a2n", "_blank")
                                },
                                {
                                    key: '6.2',
                                    icon: <GithubOutlined />,
                                    label: 'Github',
                                    onClick: () => window.open("https://github.com/a2nfinance/starlancer", "_blank")
                                },
                            ]
                        },
                        
                    ]}
                />
            </Sider>
            <Layout>

                <Header //@ts-ignore
                    style={{ padding: 0, backgroundColor: colorBgContainer }}>
                    <Space align="center" style={{ display: "flex", justifyContent: "space-between" }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <Form layout="inline">

                            <Form.Item >
                                {/* <AutoSearch /> */}
                            </Form.Item>
                            <Form.Item>
                               
                                <WalletBar />
                            </Form.Item>
                        </Form>
                    </Space>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px 0 16px',
                        padding: 16,
                        boxSizing: "border-box",
                        background: colorBgContainer,
                        maxWidth: 1440,
                        marginRight: "auto",
                        marginLeft: "auto"
                    }}
                >
                    {props.children}
                </Content>
                <Footer style={{ textAlign: 'center', maxHeight: 50 }}>Starlancer ©2024 Created by A2N Finance</Footer>
            </Layout>

        </Layout>
    )

}
