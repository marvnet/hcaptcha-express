import { NextFunction, Request, Response } from 'express';
import * as https from 'https';

import { RecaptchaMiddleware, HCaptchaOptionsV1, HCaptchaResponseDataV1, HCaptchaResponseV1 } from './interfaces';

export class HCaptchaV1 {
  private _api = {
    host:'hcaptcha.com',
    script:'/1/api.js',
    verify:'/siteverify'
  };
  private _site_key:string;
  private _secret_key:string;
  private _options:HCaptchaOptionsV1;

  constructor(site_key:string, secret_key:string, options?:HCaptchaOptionsV1){
    this._site_key = site_key
    this._secret_key = secret_key
    this._options = options || {checkremoteip:false}
    if (!this._site_key) throw new Error('site_key is required')
    if (!this._secret_key) throw new Error('secret_key is required')
  }
  get middleware():RecaptchaMiddleware {
    return {
      render: (req:Request, res:Response, next:NextFunction) => {
        res.hcaptcha = this.render();
        next();
      },
      renderWith: (optionsToOverride:HCaptchaOptionsV1) => {
        let self = this;
        return function(_req:Request, _res:Response, _next:NextFunction){
          _res.hcaptcha = self.renderWith(optionsToOverride);
          _next();
        };
      },
      verify: (req:Request, res:Response, next:NextFunction) => {
        this.verify(req, (error, data) => {
          req.hcaptcha = <HCaptchaResponseV1>{error, data}
          next();
        })
      }
    }
  }
  render(){
    return this.renderWith({});
  }
  renderWith(optionsToOverride:HCaptchaOptionsV1){
    let query_string = ''
    let captcha_attr = ''

    let options = (<any>Object).assign({},this._options, optionsToOverride);

    if (options.onload) query_string += '&onload='+options.onload
    if (options.render) query_string += '&render='+options.render
    if (options.hl) query_string += '&hl='+options.hl
    if (options.theme) captcha_attr += ' data-theme="'+options.theme+'"'
    if (options.type) captcha_attr += ' data-type="'+options.type+'"'
    if (options.callback) captcha_attr += ' data-callback="'+options.callback+'"'
    if (options.expired_callback) captcha_attr += ' data-expired-callback="'+options.expired_callback+'"'
    if (options.size) captcha_attr += ' data-size="'+options.size+'"'
    if (options.tabindex) captcha_attr += ' data-tabindex="'+options.tabindex+'"'
  
    query_string = query_string.replace(/^&/,'?')
    return  '<script src="//'+this._api.host+this._api.script+query_string+'" async defer></script>'+
            '<div class="h-captcha" data-sitekey="'+this._site_key+'"'+captcha_attr+'></div>'
  }
  verify(req:Request, cb:(error?:string|null,data?:HCaptchaResponseDataV1|null)=>void){
    let response = null;
    let post_options = null;

    if (!req) throw new Error('req is required');
    if(req.body && req.body['h-captcha-response']) response = req.body['h-captcha-response'];
    if(req.query && req.query['h-captcha-response']) response = req.query['h-captcha-response'];
    if(req.params && (<any>req.params)['h-captcha-response']) response = (<any>req.params)['h-captcha-response'];
  
    let query_string = 'secret='+this._secret_key+'&response='+response;
    if (this._options.checkremoteip){
      let remote_ip = req.headers && req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'] : req.connection.remoteAddress;
      if (remote_ip) query_string += '&remoteip=' + remote_ip
    }
    post_options = {
      host: this._api.host,
      port: '443',
      path: this._api.verify,
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(query_string)
      }
    }

    let request = https.request(post_options, (res) => {
      let body = ''

      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        body += chunk
      });
      res.on('end', () => {
        let result
        try {
          result = JSON.parse(body)
        } catch {
          return cb('invalid-json-response', null)
        }
        const error = result['error-codes'] && result['error-codes'].length > 0 ? result['error-codes'][0] : 'invalid-input-response'
        if (result.success) {
          cb(null, {hostname: result.hostname})
        }
        else cb(error, null)
      })
      res.on('error', (e) => { cb(e.message, null); });
    })
    request.write(query_string)
    request.end()
  }
}
