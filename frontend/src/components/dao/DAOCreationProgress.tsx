import { headStyle } from '@/theme/layout';
import { Card, Steps } from 'antd';
import { useAppSelector } from '../../controller/hooks';

export const DAOCreationProgress = () => {
    const { currentStep } = useAppSelector(state => state.daoForm)
    return (
        <Card title={"Steps"} headStyle={headStyle}>
            <Steps
                direction='vertical'
                current={currentStep}
                items={[
                    {
                        title: 'KYC',
                        description: "General information and social networks"
                    },
                    {
                        title: 'Treasury Managers',
                        description: "Manage company fund and pay dev salary"
                    },
                    {
                        title: 'Developer Managers',
                        description: "Review and manage developers"
                    },
                    {
                        title: 'Project Managers',
                        description: "Create and manage company projects"
                    },
                    {
                        title: 'Job Managers',
                        description: "Manage company jobs"
                    },
                    {
                        title: 'Review & Submit',
                        //description: "DAO is initialized with settings"
                    },
                ]}
            />
        </Card>

    )
}