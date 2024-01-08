import { DAOCreationProgress } from "@/components/dao/DAOCreationProgress";
import { General, ReviewAndApprove, TokenGovernance, VotingConfiguration } from "@/components/dao/form";
import { useAppSelector } from "@/controller/hooks";
import { Divider, Space } from "antd";

export default function NewDAO() {
    const { generalForm } = useAppSelector(state => state.daoForm);
    return (
        <div style={{ maxWidth: 768, margin: "auto" }}>
            <DAOCreationProgress />
            <Divider />


            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                {generalForm.status === 0 && <General isNewForm={true} />}
                {generalForm.status === 1 && <VotingConfiguration />}
                {generalForm.status === 2 && <TokenGovernance />}
                {generalForm.status === 3 && <ReviewAndApprove />}
            </Space>

        </div>
    )
}