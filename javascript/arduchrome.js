// Arduchrome
// Not working at all, this is just the temporary work I had from 3 years ago

Serial.ab2str = function(buf){
  return String.fromCharCode.apply(null, new Uint8Array(buf));
};
Serial.str2ab = function(str) {
  var len=str.length;
  var buf = new ArrayBuffer(len);
  var arr = new Uint8Array(buf);
  for (var i=0; i<len; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return buf;
};
Serial.getDevices = function(callback){
  if(callback){
      chrome.serial.getDevices(function(devices){
      var out = [];
      for(var i = 0;i < devices.length;i++){
        out.push(devices[i].path);
      }
      callback(out);
    });
  }
};
function Serial(path,options,onReceive){
  var me = this;
  this.onReceive = onReceive || function(){};
  this.send = function(str,callback){
    callback = callback || function(){};
    chrome.serial.send(this.handle.connectionId,Serial.str2ab(str),callback);
  };
  chrome.serial.connect(path,options,function(handle){
    me.handle = handle;
    me._onReceive = function(data){
      if(data.connectionId===handle.connectionId){
        me.onReceive(Serial.ab2str(data.data));
      }
    };
    chrome.serial.onReceive.addListener(me._onReceive);
  });
}
