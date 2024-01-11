import { num, shortString } from "starknet"
export type TextStruct = {
    text0: string,
    text1: string,
    text2: string,
    text3: string,
    text4: string,
    text5: string,
}
export const convertToTextStruct = (text: string) => {
    let stringArr: string[] = shortString.splitLongString(text);
    let textStruct = {
        text0: " ",
        text1: " ",
        text2: " ",
        text3: " ",
        text4: " ",
        text5: " ",
    }

    if (stringArr.length) {

        for (let i = 0; i < stringArr.length; i++) {
            switch (i) {
                case 0:
                    textStruct.text0 = stringArr[i];
                    break;
                case 1:
                    textStruct.text1 = stringArr[i];
                    break;
                case 2:
                    textStruct.text2 = stringArr[i];
                    break;
                case 3:
                    textStruct.text3 = stringArr[i];
                    break;
                case 4:
                    textStruct.text4 = stringArr[i];
                    break;
                case 5:
                    textStruct.text5 = stringArr[i];
                    break;
                default:
                    break;
            }
        }
    }
    return textStruct;
}

export const convertToString = (textStruct: TextStruct) => {

    let content = "";
    content += shortString.decodeShortString(num.toHexString(textStruct.text0));
    content += shortString.decodeShortString(num.toHexString(textStruct.text1));
    content += shortString.decodeShortString(num.toHexString(textStruct.text2));
    content += shortString.decodeShortString(num.toHexString(textStruct.text3));
    content += shortString.decodeShortString(num.toHexString(textStruct.text4));
    content += shortString.decodeShortString(num.toHexString(textStruct.text5));
    return content.trim();
}

