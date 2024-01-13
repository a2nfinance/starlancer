export const useDate = () => {
    const getLocalString = (date: number) => {
        return (
            (new Date(date)).toLocaleString()
        )
    };

    const getUnlockEveryIn = (unlockEveryType: number) => {
        let unlockType = "second(s)";
        switch (unlockEveryType) {
            case 2:
                unlockType = "minute(s)"
                break;
            case 3:
                unlockType = "hour(s)"
                break;
            case 4:
                unlockType = "day(s)"
                break;
            case 5:
                unlockType = "week(s)"
                break;
            case 6:
                unlockType = "month(s)"
                break;
            case 7:
                unlockType = "year(s)"
                break;
        }
        return unlockType;
    }


    return { getLocalString, getUnlockEveryIn };
};