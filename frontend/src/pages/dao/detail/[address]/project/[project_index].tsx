import { useRouter } from "next/router"
import { useEffect } from "react";

export default function Project() {
    const router = useRouter();


    useEffect(() => {
        if (router.query["address"] && router.query["project_index"]) {
            console.log(router.query);
        }
    }, [router.query["project_index"]])
    return (
        <>Address</>
    )
}