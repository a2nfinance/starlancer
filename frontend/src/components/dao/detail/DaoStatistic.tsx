import { useAppSelector } from '@/controller/hooks';
import { getDAOStatistics } from '@/core/c2p';
import { Col, Row, Statistic, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

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
        <Statistic title="Tasks" value={BigInt(statistics.num_tasks).toString()} />
      </Col>
    </Row>
  )
}