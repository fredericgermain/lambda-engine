const express = require('express')
const bodyParser = require('body-parser');

const appLambda = express();
const portLambda = 9000;

const appExt = express();
const portExt = 5000;

const queueLambda = [];
const queueExt = [];
const activeRequests = {};
let genId = 0;

// https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html
// https://docs.aws.amazon.com/fr_fr/lambda/latest/dg/runtimes-api.html

/*
POST /2018-06-01/runtime/init/error HTTP/1.1                                                                                                                                                               Lambda-Runtime-Function-Error-Type: Function<UserException>
Accept-Encoding: gzip;q=1.0,deflate;q=0.6,identity;q=0.3
Accept: *\/*
User-Agent: Ruby
Host: 192.168.122.1:9000
Content-Length: 272
Content-Type: appLambdalication/x-www-form-urlencoded

{"errorMessage":"unable to load config","errorType":"Init\u003cVeygo::CMS::ConfigurationError\u003e","stackTrace":[{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{
},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}]}


GET /2018-06-01/runtime/invocation/next HTTP/1.1
Accept-Encoding: gzip;q=1.0,deflate;q=0.6,identity;q=0.3
Accept: *\/*

User-Agent: Ruby
Host: 192.168.122.1:9000
*/

function schedule() {
  if (queueLambda.length === 0) {
    // TODO: launch container lambda with its env variable?
    return;
  }
  if (queueExt.length === 0) {
    // TODO: stop container?
    return;
  }
  const lambda = queueLambda.shift();
  const ext = queueExt.shift();
  const reqId = `reqId123456za-${genId++}`;

  // console.log(lambda, ext, reqId);
  lambda.res.set('Lambda-Runtime-Aws-Request-Id', reqId);
  lambda.res.set('Lambda-Runtime-Deadline-Ms', Date.now() + 60000);
  lambda.res.set('Lambda-Runtime-Invoked-Function-Arn', 'arn:lambda')
  lambda.res.set('Lambda-Runtime-Trace-Id', 'Root=1-5bef4de7-ad49b0e87f6ef6c87fc2e700;Parent=9a9197af755a6419;Sampled=1'); // TODO
  lambda.res.set('Lambda-Runtime-Client-Context', JSON.stringify({}));
  lambda.res.set('Lambda-Runtime-Cognito-Identity', JSON.stringify({}));
  const reqData = {
    "requestContext": {
        "elb": {
            "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/lambda-279XGJDqGZ5rsrHC2Fjr/49e9d65c45c6791a"
        }
    },
    "httpMethod": ext.req.method,
    "path": ext.req.path,
    "queryStringParameters": ext.req.query,
    "headers": Object.assign({},
      ext.req.headers, {
        "x-amzn-trace-id": "Root=1-5c536348-3d683b8b04734faae651f476",
        "x-forwarded-for": "72.12.164.125",
        "x-forwarded-port": "80",
        "x-forwarded-proto": "http",
        "x-imforwards": "20"
      },
    ),
    "body": ext.req.body.toString('base64'),
    "isBase64Encoded": true
  };
  lambda.res.writeHead(200, {'Content-Type': 'application/json'});
  lambda.res.end(JSON.stringify(reqData));
  activeRequests[reqId] = { lambda, ext };
}

appLambda.get('/2018-06-01/runtime/invocation/next', function (req, res) {
  queueLambda.push({req, res});
  schedule();
})

// ruby runtime returns this content-type for json data
appLambda.use(bodyParser.json({ type: 'application/x-www-form-urlencoded'}));
function handleLambdaResponse(req, res) {
  const { reqId } = req.params;
  const { lambda, ext } = activeRequests[req.params.reqId];

  // console.log(req.params, req.headers, ' -> ', req.body);

  const headers = Object.assign({
    'Content-Length': req.body.body.length,
  }, req.body.headers)
  ext.res.writeHead(req.body.statusCode, headers);
  ext.res.end(req.body.body);

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({}));

  delete activeRequests[reqId];
}

function handleLambdaError(req, res) {
  const { reqId } = req.params;
  const { lambda, ext } = activeRequests[req.params.reqId];

  // console.log(req.params, req.headers, ' -> ', req.body);

  const headers = Object.assign({
    'Content-Length': req.body.body.length,
  }, req.body.headers)
  ext.res.writeHead(500, {'Content-Type': 'application/json'});
  ext.res.end(req.body.body);

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({}));

  delete activeRequests[reqId];
}

appLambda.post('/2018-06-01/runtime/invocation/:reqId/response', handleLambdaResponse);
appLambda.post('/2018-06-01/runtime/invocation/:reqId/error', handleLambdaResponse);

appLambda.use(function (req, res) {
  resp = {error:'lambda_default_handler', path: req.path, method: req.method, body: req.body}
  // console.log(resp);
  res.json(resp);
});

appLambda.listen(portLambda, () => {
  console.log(`Lambda app listening at http://:${portLambda}`)
});

/// EXT
// TODO: how to get everything body as buffer?
appExt.use(bodyParser.raw({ type: () => true }));
appExt.use(function (req, res) {
  queueExt.push({req, res});
  schedule();
});

appExt.listen(portExt, () => {
  console.log(`Ext app listening at http://:${portExt}`)
});
