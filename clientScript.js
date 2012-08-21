var redisSubscribeCommands = [ 'psubscribe', 'punsubscribe', 'subscribe', 'unsubscribe' ];

redis = function () {

};
redis.socketCallbacks = {};

var RedisClient = function () {
  var self = this;
  if (!redis.socket) {
    redis.socket = io.connect('/');
    redis.socket.on('redis-web', function (data) {
      if (data.id && redis.socketCallbacks[data.id]) {
        redis.socketCallbacks[data.id].apply(null, data.args);
      }
    });
  }
  redisCommands.forEach(function (cmd) {
    var runFn = runCommand.bind(self, cmd);
    self[cmd] = function () {
      runFn(Array.prototype.slice.call(arguments));
    };
  });

  this.on = function (evt, callback) {
    callback = callback || function () {};
    sendSocketIoCmd('on', [evt], callback);
  };

  this.once = function (evt, callback) {
    callback = callback || function () {};
    sendSocketIoCmd('once', [evt], callback);
  };

  this.removeAllListeners = function (evt) {
    callback = function () {};
    sendSocketIoCmd('removeAllListeners', [evt], callback);
  };

  function runCommand(cmd, args) {
    cmd = cmd.toLowerCase();
    var callback;
    if (typeof(args[args.length - 1]) === 'function') {
      callback = args[args.length - 1];
      args = args.slice(0, args.length - 1);
    } else {
      callback = function (err) {
        if (err) {
          console.error('Could not run command', err);
        }
      };
    }

    if (redisSubscribeCommands.indexOf(cmd) >= 0) {
      sendSocketIoCmd(cmd, args, callback);
    } else {
      var data = {
        cmd: cmd,
        args: args
      };
      xmlhttpRequest('/redis-web-post', JSON.stringify(data), function (err, responseText) {
        if (err) {
          return callback(err);
        }
        try {
          var responseJson = JSON.parse(responseText);
          if (responseJson.err) {
            return callback(err);
          }
          return callback(null, responseJson.results);
        } catch (ex) {
          return callback(ex);
        }
      });
    }
  }

  function xmlhttpRequest(url, body, callback) {
    var xmlHttpReq = false;
    var self = this;

    // Mozilla/Safari
    if (window.XMLHttpRequest) {
      xmlHttpReq = new XMLHttpRequest();
    }

    // IE
    else if (window.ActiveXObject) {
      xmlHttpReq = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlHttpReq.open('POST', url, true);
    xmlHttpReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlHttpReq.onreadystatechange = function () {
      if (xmlHttpReq.readyState == 4) {
        if (xmlHttpReq.status === 200) {
          return callback(null, xmlHttpReq.responseText);
        } else {
          return callback(new Error('Bad response: ' + xmlHttpReq.status));
        }
      }
    };
    xmlHttpReq.send(body);
  }

  function sendSocketIoCmd(cmd, args, callback) {
    var id = Date.now() + '-' + Math.random();
    redis.socketCallbacks[id] = callback;
    redis.socket.emit('redis-web', {
      cmd: cmd,
      args: args,
      id: id
    });
  }
};

redis.createClient = function () {
  return new RedisClient();
};

