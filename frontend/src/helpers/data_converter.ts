import { convertToString } from "@/utils/cairotext"
import { num } from "starknet"

export const convertDAOData = (daoDetail) => {
    return {
        ...daoDetail,
        name: convertToString(daoDetail.name),
        short_description: convertToString(daoDetail.short_description),
        detail: convertToString(daoDetail.detail),
        social_networks: convertToString(daoDetail.social_networks).split(",")
    }
}

export const convertProjectData = (project) => {
    return {
        creator: num.toHexString(project.creator),
        start_date: project.start_date,
        end_date: project.end_date,
        title: convertToString(project.title),
        short_description: convertToString(project.short_description),
        project_detail: convertToString(project.project_detail),
        // true: active, false: closed
        status: project.status
    }
}


export const convertJobData = (job) => {
    let jobVariant = job.job_type.variant;
    let jobType = "hourly";
    if (jobVariant['FIXED_PRICE']) {
        jobType = 'fixed price'
    }
    return {
        creator: num.toHexString(job.creator),
        start_date: job.start_date,
        end_date: job.end_date,
        title: convertToString(job.title),
        short_description: convertToString(job.short_description),
        job_detail: convertToString(job.job_detail),
        // true: open, false: closed,
        job_type: jobType,
        fixed_price: job.fixed_price,
        hourly_rate: job.hourly_rate,
        pay_by_token: num.toHexString(job.pay_by_token),
        status: job.status
    }
}
// OPEN,
// ASSIGNED,
// PENDING,
// TESTING,
// REVIEWING,
// COMPLETE,
// CANCELLED
const convertTaskStatus = (status) => {
    let variant = status.variant;
    if (variant.OPEN) {
        return "assigned";
    } else if (variant.ASSIGNED) {
        return "assigned";
    } else if (variant.REVIEWING) {
        return "reviewing";
    } else if (variant.COMPLETE) {
        return "completed";
    } else if (variant.CANCELLED) {
        return "cancelled";
    }
}
export const convertTaskData = (task) => {
    console.log(task);
    return {
        index: task.index,
        creator: num.toHexString(task.creator),
        start_date: task.start_date,
        deadline: task.deadline,
        title: convertToString(task.title),
        short_description: convertToString(task.short_description),
        task_detail: convertToString(task.task_detail),
        estimate: task.estimate,
        status: convertTaskStatus(task.status)
    }
}
