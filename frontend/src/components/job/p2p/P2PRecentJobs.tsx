
import { JobItem } from "@/components/job/p2p/JobItem";
import { useAppSelector } from "@/controller/hooks";
import { getJobs } from "@/core/p2p";
import { List } from "antd";
import { useEffect } from "react"

export const P2PRecentJobs = () => {
    const {jobs, isLoadingJobs} = useAppSelector(state => state.p2p)
    useEffect(() =>{
        getJobs();
    }, [])
    return (
        <List
        grid={{
            gutter: 12,
            column: 3
        }}
        size="large"
        loading={isLoadingJobs}
        pagination={false}
        dataSource={jobs.slice(0,3)}
        renderItem={(item, index) => (
            <JobItem index={index} job={item} />
        )}
    />
    )
}