const express = require('express')
const bodyParser = require('body-parser');

const appLambda = express();
const portLambda = 9000;


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

let send = true;

appLambda.get('/2018-06-01/runtime/invocation/next', function (req, res) {
  if (!send) { return; }
  send = false;

  res.set('Lambda-Runtime-Aws-Request-Id', 'reqId123456za');
  res.set('Lambda-Runtime-Deadline-Ms', Date.now() + 60000);
  res.set('Lambda-Runtime-Invoked-Function-Arn', 'arn:lambda')
  res.set('Lambda-Runtime-Trace-Id', 'Root=1-5bef4de7-ad49b0e87f6ef6c87fc2e700;Parent=9a9197af755a6419;Sampled=1');
  res.set('Lambda-Runtime-Client-Context', JSON.stringify({}));
  res.set('Lambda-Runtime-Cognito-Identity', JSON.stringify({}));
  const reqData = {
    "requestContext": {
        "elb": {
            "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-2:123456789012:targetgroup/lambda-279XGJDqGZ5rsrHC2Fjr/49e9d65c45c6791a"
        }
    },
    "httpMethod": "GET",
    "path": "/lambda",
    "queryStringParameters": {
        "query": "1234ABCD"
    },
    "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "accept-encoding": "gzip",
        "accept-language": "en-US,en;q=0.9",
        "connection": "keep-alive",
        "host": "lambda-alb-123578498.us-east-2.elb.amazonaws.com",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
        "x-amzn-trace-id": "Root=1-5c536348-3d683b8b04734faae651f476",
        "x-forwarded-for": "72.12.164.125",
        "x-forwarded-port": "80",
        "x-forwarded-proto": "http",
        "x-imforwards": "20"
    },
    "body": "",
    "isBase64Encoded": false
};
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify(reqData));
})

// ruby runtime returns this content-type for json data
appLambda.use(bodyParser.json({ type: 'application/x-www-form-urlencoded'}));
appLambda.post('/2018-06-01/runtime/invocation/:reqId/response', function(req, res) {
  console.log(req.params, req.headers, ' -> ', req.body);
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({}));
});

appLambda.use(function (req, res) {
  resp = {error:'default_handler', path: req.path, method: req.method, body: req.body}
  console.log(resp);
  res.json(resp);
});

appLambda.listen(portLambda, () => {
  console.log(`Lambda app listening at http://:${portLambda}`)
});
