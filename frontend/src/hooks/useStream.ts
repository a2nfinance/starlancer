export const useStream = () => {
    const getPrevilegeText = (previlege: number) => {
        let text = "Sender";
        switch (previlege) {
            case 2:
                text = "Recipient"
                break;
            case 3:
                text = "Both Sender & Recipient"
                break;
            case 4:
                text = "None"
                break;
        }
        return text;
    }


    return { getPrevilegeText };
};