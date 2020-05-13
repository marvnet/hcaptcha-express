import { HCaptchaResponseV1 } from '../interfaces';

declare global {
    namespace Express {
        export interface Request {
            hcaptcha?: HCaptchaResponseV1;
        }
        export interface Response {
            hcaptcha?: string;
        }
    }
}
