A simple AWS ALB/Lambda target group engine.

This is still experimental.

# Introduction
This engine allows you to run your local lambda runtime container locally, for development or testing.

Tested on a Ruby/Rails app using Lamby, but it should be language independent.

1) Start the engine :

`node app.js`
`npx lambda-engine`

The engine listens by default on 
- port 5000 for external HTTP request (the one that are send on ALB), a
- port 9000 for AWS Lambda invocation.

2) Start your runtime

`docker run --rm --it --name my-awesome-runtime-0 -e AWS_LAMBDA_RUNTIME_API="192.168.x.x:9000" -e OTHER_LAMBDA_ENV=this image_name:image_tag`

3) Test you HTTP endpoint
`curl http://192.168.x.x:5000`

#AWS useful doc

* Lambda runtime API : https://docs.aws.amazon.com/fr_fr/lambda/latest/dg/runtimes-api.html
* Lambda-ALB interface : https://docs.aws.amazon.com/lambda/latest/dg/services-alb.html

# Notes on Lambda and MVC frameworks.

AWS Lambda is not very appropriate for Rails/Django kind of app, where many of your time is spend in request to DB/external service. It doesn't make use of multi-threading. A runtime should be able to process multiple events in parallel, while only being billed on the actual time the runtime is active.

If your app is not active very often, it's OK though to use Lambda, as you wouldn't use this parallelization of event anyway.

For reactive scaling-up, it'd be better to use a service which can span VMs fast, making use of a multi-threading runtime (puma...). AWS is (purposefully?) quite bad at spanning VMs fast.


