import { HCaptchaResponseDataV1 } from "./RecaptchaResponseData";

export interface HCaptchaResponseV1 {
    error?: string,
    data?: HCaptchaResponseDataV1
}