var express = require('express'),
  app = express(),
  port = process.env.PORT || 5050;
var request = require('request');
var fs = require('fs');

app.listen(port);

console.log('todo list RESTful API server started on: ' + port);

app.get('/tiles/:z/:x/:y', function(req, res){
  console.log(req.params);
  if(req.params.z == '14'){
    var URL = "https://tiles.openplanner.team/planet/14/" + req.params.x + "/" + req.params.y;
    request(URL, function(error, resp, body){
      if(!error && resp.statusCode == 200){
        res.send(body);
      }
    });
  }
  else {
    var file = __dirname + "/tiles/" + req.params.z + "/" + req.params.x + "-" + req.params.y + ".json";
    if (fs.existsSync(file)) {
    //file exists
      res.download(file);
    }
    else {
      res.status(404).send("Tile with zoom level " + req.params.z + ", x-id " + req.params.x + " and y-id " + req.params.y + " was not found.");
    }
  }
});
