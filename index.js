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

  middleWare.redisClientArgs = arguments;

  middleWare.setSocketIo = function (sio) {
    middleWare.sio = sio;
    middleWare.sio.on('connection', function (socket) {
      socket.pubsubClient = redis.createClient.apply(redis, middleWare.redisClientArgs);
      socket.on('redis-web', function (data) {
        data.args.push(function () {
          var d = {
            id: data.id,
            args: Array.prototype.slice.call(arguments)
          };
          socket.emit('redis-web', d);
        });
        socket.pubsubClient[data.cmd].apply(socket.pubsubClient, data.args);
      });
      socket.on('disconnect', function () {
        socket.pubsubClient.quit();
      })
    });
  };

  middleWare.cmdClient = redis.createClient.apply(redis, middleWare.redisClientArgs);

  return middleWare;
};
