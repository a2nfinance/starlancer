import { DeveloperList } from '@/components/developer/DeveloperList';
import { JobList } from '@/components/job/JobList';
import { TokenBalances } from '@/components/treasury/TokenBalances';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';
import { ProjectList } from '../../project/ProjectList';
import { MyTasks } from '@/components/developer/MyTasks';


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
            children: <TokenBalances/>,
        },
        {
            key: '4',
            label: `Developers`,
            children: <DeveloperList />
        },
        {
            key: '5',
            label: `My Tasks (Dev Only)`,
            children: <MyTasks />
        }
    ];

    return (
        <Tabs defaultActiveKey="1" items={items} onChange={() => { }} />
    )
}