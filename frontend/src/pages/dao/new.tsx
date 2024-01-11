import { DAOCreationProgress } from "@/components/dao/DAOCreationProgress";
import { General, TreasuryManagers, DeveloperManagers, ProjectManagers, JobManagers } from "@/components/dao/form";
import { ReviewAndApprove } from "@/components/dao/form/ReviewAndApprove";
import { useAppSelector } from "@/controller/hooks";
import { Col, Divider, Row, Space } from "antd";

export default function NewDAO() {
    const { currentStep } = useAppSelector(state => state.daoForm);
    return (
        <div style={{ maxWidth: 1440, minWidth: 780, margin: "auto" }}>
            <Row gutter={10}>
                <Col span={14}>

                    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                        {currentStep === 0 && <General />}
                        {currentStep === 1 && <TreasuryManagers />}
                        {currentStep === 2 && <DeveloperManagers />}
                        {currentStep === 3 && <ProjectManagers />}
                        {currentStep === 4 && <JobManagers />}
                        {currentStep === 5 && <ReviewAndApprove />}
                    </Space>
                </Col>
                <Col span={10}><DAOCreationProgress /></Col>
            </Row>






        </div>
    )
}