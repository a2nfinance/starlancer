import { convertToString } from "@/utils/cairotext"

export const convertDAOData = (daoDetail) => {
    return {
        ...daoDetail,
        name: convertToString(daoDetail.name),
        short_description: convertToString(daoDetail.short_description),
        detail: convertToString(daoDetail.detail),
        social_networks: convertToString(daoDetail.social_networks).split(",")
    }
}