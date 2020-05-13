import {Request, Response, NextFunction} from 'express';
import { HCaptchaOptionsV1 } from './RecaptchaOptions';

export interface RecaptchaMiddleware {
    renderWith(optionsToOverride: HCaptchaOptionsV1): (req : Request, res : Response, next : NextFunction) => void; 
    render(req: Request, res : Response, next : NextFunction): void; 
    verify(req : Request, res : Response, next : NextFunction): void;
}