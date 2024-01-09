"use client";
import { DisconnectOutlined } from "@ant-design/icons";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { Button, Dropdown, Image, MenuProps, Space, message  } from "antd";
import { useMemo } from "react";


function WalletConnected() {
  const { connector } = useConnect();
  const [messageApi, contextHolder] = message.useMessage();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();


  const shortenedAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return (
    <Space>
      {contextHolder}
      <Button icon={<Image src={connector?.icon.dark} preview={false} width={20} />} type="primary" size="large" onClick={() => { window.navigator.clipboard.writeText(address || ""); messageApi.success("Copied address")}}>{shortenedAddress}</Button>
      <Button size={"large"} icon={<DisconnectOutlined />} onClick={() => disconnect()}></Button>
    </Space>
  );
}

function ConnectWallet() {
  const { connectors, connect } = useConnect();
  const items: MenuProps['items'] = connectors.map((connector) => {
    return {
      key: connector.id,
      label: (
        <Button
          icon={<Image src={connector.icon.dark} preview={false} width={20} />}
          key={`btt-${connector.id}`}
          onClick={() => connect({ connector })}
          className="gap-x-2 mr-2"
        >
          {connector.id}
        </Button>
      )
    }
  })
  return (
    <div>
      <Dropdown menu={{
        items
      }} placement="bottomLeft">
        <Button size="large" type="primary">Connect Wallet</Button>
      </Dropdown>

    </div>
  );
}

export const WalletBar = () => {
  const { address } = useAccount();

  return address ? <WalletConnected /> : <ConnectWallet />;
}
