import { Button, Col, Divider, Drawer, Input, Modal, Popover, Row, Select, Space, Statistic, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '@/controller/hooks';
import { useAccount } from '@starknet-react/core';
import { useRouter } from 'next/router';
import { getDAOStatistics } from '@/core/c2p';

const {Text} = Typography;

export const DaoStatistic = () => {
  const { statistics } = useAppSelector(state => state.daoDetail);
  const router = useRouter();

  useEffect(() => {
      if (router.query["address"]) {
          getDAOStatistics(router.query["address"].toString());
      }
  }, [router.query["address"]])




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
      <Col span={4}>
        <Statistic title="Task" value={BigInt(statistics.num_tasks).toString()} />
      </Col>
    </Row>
  )
}