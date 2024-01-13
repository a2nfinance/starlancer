
export const calculateUnlockEvery = (unlockEvery: number, unlockEveryType: number) => {
    let unlockSeconds = unlockEvery;
    switch (unlockEveryType) {
        case 2:
            unlockSeconds *= 60;
            break;
        case 3:
            unlockSeconds *= 60 * 60;
            break;
        case 4:
            unlockSeconds *= 60 * 60 * 24;
            break;
        case 5:
            unlockSeconds *= 60 * 60 * 24 * 7;
            break;
        case 6:
            unlockSeconds *= 60 * 60 * 24 * 30;
            break;
        case 7:
            unlockSeconds *= 60 * 60 * 24 * 365;
            break;
    }
    return unlockSeconds;
}