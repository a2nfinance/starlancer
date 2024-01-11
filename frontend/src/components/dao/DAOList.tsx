import { List } from "antd";
import { useEffect } from "react";
import { useAppSelector } from "@/controller/hooks";
import { getDAOs } from "@/core/c2p";
import { Item } from "./Item";

export const DAOList = () => {
    // const { featuredProjects } = useAppSelector(state => state.project)
    const {daos, isLoadingDAOs} = useAppSelector(state => state.dao)
    useEffect(() => {
        getDAOs()
    }, [])
    return (
        <List
            grid={{
                gutter: 12,
                column: 3
            }}
            size="large"
            loading={isLoadingDAOs}
            pagination={false}
            dataSource={daos}
            renderItem={(item, index) => (
                <Item index={index} dao={item} />
            )}
        />

    )
}

