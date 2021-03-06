# express-hcaptcha

[![NPM](https://nodei.co/npm/express-hcaptcha.png?compact=true)](https://nodei.co/npm/express-hcaptcha/)

[![Build Status][ci-image]][ci-url]
[![npm version][npm-version-image]][npm-version-url]

[Google hcaptcha][Google-hcaptcha] middleware for express.

<img src="https://www.google.com/hcaptcha/intro/images/hero-hcaptcha-demo.gif" width="300px" />

## Table of contents

- [Installation](#installation)
- [Requirements](#requirements)
- [Usage](#usage)
  - [How to initialise](#how-to-initialise)
  - [`options` available/properties](#options-availableproperties)
  - [Render - `hcaptcha.middleware.render`](#render---recaptchamiddlewarerender)
  - [Render and override options - `hcaptcha.middleware.renderWith`](#render---recaptchamiddlewarerenderwith)
  - [Verify - `hcaptcha.middleware.verify`](#verify---recaptchamiddlewareverify)
  - [List of possible error codes](#list-of-possible-error-codes)
- [Examples](#examples)

## Installation

```shell
npm install express-hcaptcha --save
```

## Requirements

- [Expressjs][expressjs]
- A [body parser][body-parser] middleware to get captcha data from query: (If you're using an express version older than 4.16.0)
  ```javascript
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  ```

## Usage

### How to initialise:

#### For versions >= 4.\*.\*: (New usage)
```javascript
var HCaptcha = require('express-hcaptcha').HCaptchaV1;
//import HCaptcha from 'express-hcaptcha'
var hcaptcha = new HCaptcha('SITE_KEY', 'SECRET_KEY');
//or with options
var options = {'theme':'dark'};
var hcaptcha = new HCaptcha('SITE_KEY', 'SECRET_KEY', options);
```

If you're using the older version of express-hcaptcha (`3.\*.\*`), then you should require HCaptcha like so: (everything else is unchanged)

```javascript
var HCaptcha = require('express-hcaptcha');
```

#### `options` available/properties:
| option             | description                                                                                                                                         |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `onload`           | The callback function that gets called when all the dependencies have loaded.                                                                       |
| `render`           | Value could be **explicit** OR **onload**, Whether to render the widget explicitly.                                                                 |
| `hl`               | Forces the widget to render in a specific language (Auto-detects if unspecified).                                                                   |
| `theme`            | Value could be **dark** OR **light**, The color theme of the widget (default light).                                                                |
| `type`             | Value could be **audio** OR **image**, The type of CAPTCHA to serve.                                                                                |
| `callback`         | Your callback function that's executed when the user submits a successful CAPTCHA response.                                                         |
| `expired_callback` | Your callback function that's executed when the hcaptcha response expires and the user needs to solve a new CAPTCHA.                               |
| `size`             | The size of the widget.                                                                                                                             |
| `tabindex`         | The tabindex of the widget and challenge. If other elements in your page use tabindex, it should be set to make user navigation easier.             |
| `checkremoteip`    | Adding support of remoteip verification (based on x-forwarded-for header or remoteAddress.Value could be **true** OR **false** (default **false**). |

**For more information, please refer to:**
- [reCaptcha - display](https://developers.google.com/hcaptcha/docs/display#config)
- [reCaptcha - verify ](https://developers.google.com/hcaptcha/docs/verify)

### Render - `hcaptcha.middleware.render`
The middleware's render method sets the `hcaptcha` property of `res` object (new in version >= 3.\*.\*, was `req` previously), with the generated html code. Therefore, you can easily append hcaptcha into your templates by passing `res.hcaptcha` to the view:

```javascript
app.get('/', hcaptcha.middleware.render, function(req, res){
  res.render('login', { captcha:res.hcaptcha });
});
```

### Render - `hcaptcha.middleware.renderWith`
Same as the render middleware method except that you can override the options in parameter :
```javascript
app.get('/', hcaptcha.middleware.renderWith({'theme':'dark'}), function(req, res){
  res.render('login', { captcha:res.hcaptcha });
});
```


### Verify - `hcaptcha.middleware.verify`
The middleware's verify method sets the `hcaptcha` property of `req` object, with validation information:

```javascript
app.post('/', hcaptcha.middleware.verify, function(req, res){
  if (!req.hcaptcha.error) {
    // success code
  } else {
    // error code
  }
});
```

The response verification is performed on `params`, `query`, and `body` properties for the `req` object.

Here is an example of a `req.hcaptcha` response:

#### Example of verification response:

```javascript
{
  error: string, // error code (see table below), null if success
  data: {
    hostname: string // the site's hostname where the reCAPTCHA was solved
  }
}
```

#### List of possible error codes:

| Error code               | Description                                     |
|:-------------------------|:------------------------------------------------|
| `missing-input-secret`   | The secret parameter is missing.                |
| `invalid-input-secret`   | The secret parameter is invalid or malformed.   |
| `missing-input-response` | The response parameter is missing.              |
| `invalid-input-response` | The response parameter is invalid or malformed. |
| `invalid-json-response`  | Can't parse google's response. Server error.    |


## Examples

### express-hcaptcha - with verification middleware:

```javascript
var express = require('express');
var bodyParser = require('body-parser');
var pub = __dirname + '/public';
var app = express();
var HCaptcha = require('express-hcaptcha').HCaptchaV1;

var hcaptcha = new HCaptcha('SITE_KEY', 'SECRET_KEY');

//- required by express-hcaptcha in order to get data from body or query.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(express.static(pub));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', hcaptcha.middleware.render, function(req, res){
  res.render('login', { captcha:res.hcaptcha });
});

// override default options for that route
app.get('/fr', hcaptcha.middleware.renderWith({'hl':'fr'}), function(req, res){
  res.render('login', { captcha:res.hcaptcha });
});

app.post('/', hcaptcha.middleware.verify, function(req, res){
  if (!req.hcaptcha.error) {
    // success code
  } else {
    // error code
  }
});
```

### express-hcaptcha - without verification middleware: (using `hcaptcha.verify` callback instead)

```javascript
var express = require('express');
var bodyParser = require('body-parser');
var pub = __dirname + '/public';
var app = express();
var HCaptcha = require('express-hcaptcha').HCaptchaV1;

var hcaptcha = new HCaptcha('SITE_KEY', 'SECRET_KEY');

//- required by express-hcaptcha in order to get data from body or query.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use(express.static(pub));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.get('/', function(req, res){
  res.render('login', { captcha:hcaptcha.render() });
});

// override default options for that route
app.get('/fr', function(req, res){
  res.render('login', { captcha:hcaptcha.renderWith({'hl':'fr'}) });
});

app.post('/', function(req, res){
  hcaptcha.verify(req, function(error, data){
    if (!req.hcaptcha.error) {
      // success code
    } else {
      // error code
    }
  });
});
```

### Demo:

Run the example folder for a live demo:

```
$ node example\server.js
```

[ci-image]: https://travis-ci.org/pdupavillon/express-hcaptcha.svg?branch=master
[ci-url]: https://travis-ci.org/pdupavillon/express-hcaptcha
[npm-version-image]: https://badge.fury.io/js/express-hcaptcha.svg
[npm-version-url]: http://badge.fury.io/js/express-hcaptcha

[expressjs]: https://github.com/expressjs/express
[body-parser]: https://github.com/expressjs/body-parser
[Google-hcaptcha]:https://www.google.com/hcaptcha
