'use strict';

var fs = require('fs');
var path = require('path');

var redis = require('redis');
var redisCommands = require('redis/lib/commands');
var clientScript;

clientScript = 'var redisCommands = ' + JSON.stringify(redisCommands) + ';\n\n';
clientScript += fs.readFileSync(path.join(__dirname, 'clientScript.js'), 'utf8') + '\n\n';
clientScript += 'redis.print = ' + redis.print.toString() + ';\n';

module.exports = function () {
  var middleWare = function (req, res, next) {
    if (req.url.indexOf('/redis-web.js') >= 0) {
      res.setHeader('content-type', 'text/javascript');
      return res.end(clientScript);
    }

    if (req.url.indexOf('/redis-web-post') >= 0) {
      req.body = '';
      req.on('data', function (d) {
        req.body += d.toString('utf8');
      });
      req.on('end', function (d) {
        if (d) {
          req.body += d.toString('utf8');
        }
        try {
          var data = JSON.parse(req.body);

          data.args.push(function (err, results) {
            return res.end(JSON.stringify({
              err: err,
              results: results
            }));
          });
          middleWare.cmdClient[data.cmd].apply(middleWare.cmdClient, data.args);
        } catch (ex) {
          return next(new Error("Invalid POST body"));
        }
      });
      return;
    }

    return next();
  };

  middleWare.setSocketIo = function (sio) {
    middleWare.sio = sio;
    middleWare.sio.on('connection', function (socket) {
      middleWare.socket = socket;
    });
  };

  middleWare.cmdClient = redis.createClient.apply(redis, arguments);
  middleWare.pubsubClient = redis.createClient.apply(redis, arguments);

  return middleWare;
};
