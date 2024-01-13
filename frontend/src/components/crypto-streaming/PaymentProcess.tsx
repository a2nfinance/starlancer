import { Progress } from "antd";
import { useEffect, useState } from "react";
import { calculateUnlockEvery } from "@/helpers/stream";

export default function PaymentProcess({ stream }) {
    const [unlockAmount, setUnlockAmount] = useState(0);
    const [firstLoading, setFirstLoading] = useState(false);
    useEffect(() => {
        if (!firstLoading) {
            let paymentAmount = stream.unlock_amount_each_time * stream.unlock_number;
            let unlockFrequency = calculateUnlockEvery(stream.unlock_every, stream.unlock_every_type) * 1000;
            if (stream.status === 1) {

                let i = setInterval(function () {
                    let numberOfUnlock = Math.floor(
                        (new Date().getTime() - (stream.start_date)) / unlockFrequency
                    );

                    let ua = numberOfUnlock * stream.unlock_amount_each_time
                    if (ua <= 0) {
                        setUnlockAmount(0);
                    }
                    if (ua > 0 && ua <= paymentAmount) {
                        setUnlockAmount(ua)
                    }

                    if (ua >= paymentAmount) {
                        setUnlockAmount(paymentAmount);
                        clearInterval(i);
                    }
                }, stream.frequency)
            } else {
                setUnlockAmount(paymentAmount)
            }
            setFirstLoading(true)

        }

    }, [firstLoading])

    return (

        <Progress percent={Math.floor(unlockAmount * 100 / (stream.unlock_amount_each_time * stream.unlock_number))}
            status="active"
            strokeColor={{ from: '#108ee9', to: '#87d068' }} />

    )
}