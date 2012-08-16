redis = function () {

};

var RedisClient = function () {
  var self = this;
  this.socket = io.connect('/');
  redisCommands.forEach(function (cmd) {
    var runFn = runCommand.bind(self, cmd);
    self[cmd] = function () {
      runFn(Array.prototype.slice.call(arguments));
    };
  });

  function runCommand(cmd, args) {
    var callback = args[args.length - 1];
    if (typeof(callback) === 'function') {
      args = args.slice(0, args.length - 1);
    } else {
      callback = function () {};
    }

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
};

redis.createClient = function () {
  var result = new RedisClient();
  return result;
};

