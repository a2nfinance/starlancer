import { JobList } from '@/components/job/JobList';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { ProjectList } from '../../project/ProjectList';


export const DaoTabs = () => {
    const items: TabsProps['items'] = [
        {
            key: '1',
            label: `Projects`,
            children:  <ProjectList />,
        },
        {
            key: '2',
            label: `Jobs`,
            children: <JobList />
        },
        {
            key: '3',
            label: `Treasury`,
            children: <></>,
        },
        {
            key: '4',
            label: `Developers`,
            children: <></>
        }
    ];

    return (
        <Tabs defaultActiveKey="1" items={items} onChange={() => { }} />
    )
}