import { UserRoles } from "@/controller/dao/daoDetailSlice";

export const useRoles = () => {
    const isAllowApply = (userRoles: UserRoles) => {
        return (!userRoles.is_member && !userRoles.is_job_manager && !userRoles.is_treasury_manager && !userRoles.is_project_manager && !userRoles.is_member_manager)
    };
    return { isAllowApply };
};