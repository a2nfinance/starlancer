import { ProjectRoles, Task, UserRoles } from "@/controller/dao/daoDetailSlice";

export const useRoles = () => {
    const isAllowApply = (userRoles: UserRoles) => {
        return (!userRoles.is_member && !userRoles.is_job_manager && !userRoles.is_treasury_manager && !userRoles.is_project_manager && !userRoles.is_member_manager)
    };
    const isAllowChangingStatus = (projectRoles: ProjectRoles, task: Task, address: string) => {
        return (projectRoles.is_code_reviewer || projectRoles.is_task_manager || task.creator === address);
    }
    return { isAllowApply, isAllowChangingStatus };
};