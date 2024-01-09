import { Button, Col, Divider, Drawer, Input, Modal, Popover, Row, Select, Space, Statistic, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/controller/hooks';
import { NewMembersForm } from './NewMembersForm';
import { LoanForm } from './LoanForm';
import { useAccount } from '@starknet-react/core';
import { useRouter } from 'next/router';
import { getDAOStatistics } from '@/core/c2p';

const {Text} = Typography;

export const DaoStatistic = () => {
  const { statistics } = useAppSelector(state => state.daoDetail);
  const { address } = useAccount();
  const { addFundAction, optInAssetAction, addMemberAction } = useAppSelector(state => state.process);

  const [fundAmount, setFundAmount] = useState("");
  const [newMembersModalOpen, seNewMembersModalOpen] = useState(false);
  const [newLoanModalOpen, setNewLoanModalOpen] = useState(false);
  const { detail } = useAppSelector(state => state.daoDetail);
  const router = useRouter();

  useEffect(() => {
      if (router.query["address"]) {
          getDAOStatistics(router.query["address"].toString());
      }
  }, [router.query["address"]])


  const showNewMemberModal = () => {
    seNewMembersModalOpen(true);
  };

  const handleNewMembersModalOk = () => {
    seNewMembersModalOpen(false);
  };

  const handleNewMembersModalCancel = () => {
    seNewMembersModalOpen(false);
  };

  const showLoanModal = () => {
    setNewLoanModalOpen(true);
  };

  const handleLoanModalOk = () => {
    setNewLoanModalOpen(false);
  };

  const handleLoanModalCancel = () => {
    setNewLoanModalOpen(false);
  };


  const [openFundPopup, setOpenFundPopup] = useState(false);

  const handleOpenFundPopupChange = (newOpen: boolean) => {
    setOpenFundPopup(newOpen);
  };

  const fund = useCallback(() => {
    // fundDAO(address, parseFloat(fundAmount), signTransactions, sendTransactions);
  }, [fundAmount])

  const handleOptIn = () => {
    // optAccountIntoAsset(activeAccount?.address, signTransactions, sendTransactions);
  }

  return (
    <Row gutter={8}>
      <Col span={4}>
        <Statistic title="Projects" value={BigInt(statistics.num_projects).toString()} />
      </Col>
      <Col span={4}>
        <Statistic title="Developers" value={BigInt(statistics.num_members).toString()} />
      </Col>
      <Col span={4}>
        <Statistic title="Jobs" value={BigInt(statistics.num_jobs).toString()} />
      </Col>
      <Col span={12}>
        <Text>Actions</Text>
        <br/>
        <Space direction="horizontal">
          {/* {
            address === detao.creator && <Button type="primary" loading={addMemberAction.processing} onClick={() => showNewMemberModal()} ghost>
              Add members
            </Button>
          }
          {
            address === daoFromDB.creator && <Button type="primary" onClick={() => showLoanModal()} ghost>
              New loan program
            </Button>
          } */}
          <Button type="primary" loading={optInAssetAction.processing} onClick={() => handleOptIn()} ghost>
            Opt-in
          </Button>

          <Popover
            content={
              <Space direction='vertical' >
                <Input name='amount' size='large' addonAfter={"ALGO"} type='number' value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} />
                <Divider />
                <Button type='primary' onClick={() => fund()} loading={addFundAction.processing}>Send</Button>
              </Space>
            }
            title="Token"
            trigger="click"
            open={openFundPopup}
            onOpenChange={handleOpenFundPopupChange}
          >
            <Button type="primary" loading={addFundAction.processing}>Fund</Button>
          </Popover>
        </Space>

      </Col>
      <Modal title="New members" open={newMembersModalOpen} onOk={handleNewMembersModalOk} onCancel={handleNewMembersModalCancel} footer={null}>
            {/* <NewMembersForm /> */}
      </Modal>
      <Modal width={600} title="New loan program" open={newLoanModalOpen} onOk={handleLoanModalOk} onCancel={handleLoanModalCancel} footer={null}>
            {/* <LoanForm /> */}
      </Modal>
    </Row>
  )
}