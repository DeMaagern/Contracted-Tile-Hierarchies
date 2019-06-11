function edgeDifferenceCompareFunction(a, b){
  //return a.edgeDifference < b.edgeDifference ? -1 : a.edgeDifference > b.edgeDifference ? 1 : 0;
  return a.edgeDifference < b.edgeDifference ? -1 : a.edgeDifference > b.edgeDifference ? 1 : 0;
}

var t = require('tiles-in-bbox');
var mymap;
var markerLayer;
var node1;
var node2;
var tilesFetched = 0;
var totalTiles = 0;
var fetchingDone = false;
var startTime;
var fetchTime;
var shortestPathTime;


document.addEventListener('DOMContentLoaded', (event) => {
  mymap = L.map('mapid').setView([50.994404, 3.745488], 12);
  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Data © <a href="http://osm.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(mymap);
  markerLayer = L.layerGroup().addTo(mymap);


  mymap.on('click', function(e) {
    var location= e.latlng;
    getClosestNode(e.latlng);
  });
});

var graph = new Graph(true, true);

async function getClosestNode(latlng){
  var id = getTiles(latlng.lat, latlng.lng, latlng.lat, latlng.lng, 14);
  var URL = "https://tiles.openplanner.team/planet/14/" + id[0].x + "/" + id[0].y;
  $.ajax({
    type: 'GET',  // http method
    url: URL,
    success: function (data, status, xhr) {
      //console.log("Succes!");
      var nodes = parseJson(data, 14).nodes;
      // Get closest node
      var closestNode = Object.keys(nodes)[0];
      var closestDistance = haversineDistance(latlng.lng, latlng.lat, nodes[closestNode].x, nodes[closestNode].y);
      for(var nodeId in nodes){
        var dist = haversineDistance(latlng.lng, latlng.lat, nodes[nodeId].x, nodes[nodeId].y);
        if(dist < closestDistance){
          closestDistance = dist;
          closestNode = nodes[nodeId];
        }
      }

      if(!node1){
        node1 = JSON.parse(JSON.stringify(closestNode));
        markerLayer.clearLayers();
        L.circle([node1.y, node1.x], {radius: 50}).addTo(markerLayer);
      }else if(!node2){
        node2 = JSON.parse(JSON.stringify(closestNode));


        // Do all code for route calculation
        L.circle([node2.y, node2.x], {radius: 50}).addTo(markerLayer);
        // Fetch all tiles from start & finish untill they meet
        startTime = Date.now();
        reconstructGraph(node1, node2);
      }
    },
    error: function (jqXhr, textStatus, errorMessage) {
      console.log("Failed.... Please retry!");
    }
  });
}

function drawPoint(lat, lon){
  L.circle([lat, lon], {radius: 2, color: "red"}).addTo(markerLayer);
}

async function reconstructGraph(node1, node2){
  var zoomlevel = 14;
  // Get tile ID's
  var tile1 = getTiles(node1.y, node1.x, node1.y, node1.x, zoomlevel);
  var tile2 = getTiles(node2.y, node2.x, node2.y, node2.x, zoomlevel);

  while(tile1[0].x != tile2[0].x || tile1[0].y != tile2[0].y){
    // Fetch tiles
    await fetchTileAndAddToGraph(tile1[0].x, tile1[0].y, zoomlevel);
    await fetchTileAndAddToGraph(tile2[0].x, tile2[0].y, zoomlevel);

    zoomlevel--;
    // Get new tile ID's
    tile1 = getTiles(node1.y, node1.x, node1.y, node1.x, zoomlevel);
    tile2 = getTiles(node2.y, node2.x, node2.y, node2.x, zoomlevel);
  }
  // Fetch tiles
  await fetchTileAndAddToGraph(tile2[0].x, tile2[0].y, zoomlevel);
}

async function fetchTileAndAddToGraph(x, y, z){
  totalTiles++;
  drawBoundingBox(x, y, z);
  var URL = "http://localhost:5050/tiles/" + z + "/" + x + "/" + y;
  $.ajax({
    type: 'GET',  // http method
    url: URL,
    success: function (data, status, xhr) {
      var jsonData = parseJson(data, z);
      if(z <= 9){
        addDataToGraphStructure(jsonData, graph, false, z);
      }
      else {
        addDataToGraphStructure(jsonData, graph, false, z);
      }

      tilesFetched++;
      addingFinished();
    },
    error: function (jqXhr, textStatus, errorMessage) {
      console.log("Failed.... Please retry!");
    }
  });
}

function drawBoundingBox(x, y, z){
  var colour = {
    14: "green",
    13: "red",
    12: "purple",
    11: "orange",
    10: "cyan",
    9: "gray"
  };
  var y1 = tile2lat(y, z);
  var x1 = tile2long(x, z);

  var y2 = tile2lat(y+1, z);
  var x2 = tile2long(x+1, z);

  //console.log(y1 + " - " + x1 + " - " + y2 + " - " + x2);

  L.polyline([
    [y1, x1],
    [y1, x2],
    [y2, x2],
    [y2, x1],
    [y1, x1]
  ], {
    color: colour[z]
  }).addTo(mymap);
}

function addingFinished(){
  if(tilesFetched == totalTiles){
    reconstructTime = Date.now();
    // Do shortest path search
    var path = [];
    var result = graph.ShortestPathBiDirectional(node1.id, node2.id);
    shortestPathTime = Date.now();

    //
    console.log(startTime);
    console.log(reconstructTime);
    console.log(shortestPathTime);
    console.log("Total time: " + (shortestPathTime - startTime) + " ms");
    console.log("Reconstruct time: " + (reconstructTime - startTime) + " ms");
    console.log("Calculation time: " + (shortestPathTime - reconstructTime) + " ms");

    if(result){
      path = result.previous.split(' ');
    }
    else {
      console.error("No path found");
    }
    for(var i = 0; i < path.length-1; i++){
      var nodeId1 = path[i];
      var nodeId2 = path[i+1];
      if(!graph.nodes[nodeId1]){
        continue;
      }
      if(!graph.nodes[nodeId2]){
        continue;
      }
      var x1 = graph.nodes[nodeId1].x;
      var y1 = graph.nodes[nodeId1].y;
      var x2 = graph.nodes[nodeId2].x;
      var y2 = graph.nodes[nodeId2].y;

      L.polyline([
        [y1, x1],
        [y2, x2]
      ], {
        color: "blue"
      }).addTo(markerLayer);
    }
    tilesFetched = 0;
    fetchingDone = false;
    totalTiles = 0;
    graaf = {};
  }
}

function drawLine(nodeId1, nodeId2, color){
  var x1 = graph.nodes[nodeId1].x;
  var y1 = graph.nodes[nodeId1].y;
  var x2 = graph.nodes[nodeId2].x;
  var y2 = graph.nodes[nodeId2].y;

  L.polyline([
    [y1, x1],
    [y2, x2]
  ], {
    color: color,
    opacity: 0.3
  }).addTo(markerLayer);
}

function addDataToGraphStructure(data, graaf, draw, z){
  var colour = {
    14: "green",
    13: "red",
    12: "purple",
    11: "orange",
    10: "cyan",
    9: "gray",
    4: "white",
    3: "black",
    2: "pink",
    1: "brown"
  };

  for(var nodeId in data.nodes){
    graaf.addNode(new Node( data.nodes[nodeId].id, data.nodes[nodeId].x, data.nodes[nodeId].y));
  }
  for(var i = 0; i < data.edges.length; i++){
    var edge = new Edge(data.edges[i].from, data.edges[i].to, data.edges[i].weight, data.edges[i].id);
    edge.zoomLevel = data.edges[i].zoomLevel;
    graaf.addEdge(edge);
    if(data.edges[i].bidirectional){
      var edge2 = new Edge(data.edges[i].to, data.edges[i].from, data.edges[i].weight, data.edges[i].id);
      edge2.zoomLevel = data.edges[i].zoomLevel;
      graaf.addEdge(edge2);
    }
    if(draw){
        drawLine(data.edges[i].from, data.edges[i].to, colour[z]);
    }
  }
}

function parseJson(jsonData, z){
  var result = {};
  result.nodes = {};
  result.edges = [];
  jsonData["@graph"].forEach(function(elem){
    // Node
    if(elem["geo:long"] || elem["@type"] == "osm:Node" || elem["@type"] == "osm:node"){
      if(!result.nodes[elem["@id"]]){
        var xCoo = elem["geo:long"];
        var yCoo = elem["geo:lat"];
        var n = {};
        n.id = elem["@id"];
        n.x = elem["geo:long"];
        n.y = elem["geo:lat"];
        result.nodes[elem["@id"]] = n;
      }
    } else if(elem["@type"] == "osm:Way" || elem["@type"] == "osm:way" || elem["@type"] == "rt:shortcut"){
      // For each edge connecting 2 nodes
      var nodesOnWay = [];
      if(elem["osm:nodes"]){
        nodesOnWay.push.apply(nodesOnWay, elem["osm:nodes"]);
      }
      if(elem["osm:hasNodes"]){
        nodesOnWay.push.apply(nodesOnWay, elem["osm:hasNodes"]);
      }
      for(var i = 0; i < nodesOnWay.length - 1; i++){
        var e1 = {};
        e1.from = nodesOnWay[i];
        e1.to = nodesOnWay[i+1];
        e1.id = elem["@id"];
        e1.zoomLevel = elem["rt:zoomLevel"];
        if(z != 14 && elem["weight"] != undefined){
          e1.weight = elem["weight"];
        }
        else {
          e1.weight = haversineDistance(result.nodes[e1.from].x, result.nodes[e1.from].y, result.nodes[e1.to].x, result.nodes[e1.to].y);
        }
        if(result.edges[elem["@id"]]){
          //console.log("Edge already exists");
        }
        if(elem["osm:oneway"] != "osm:yes" || elem["osm:oneWay"] == undefined){
          e1.bidirectional = true;
        }
        result.edges.push(e1);
      }
    }
    else {
      
    }
  });
  return result;
}
// LONG = x
// LAT = y
function mergeJson(object, property, object2, property2){
  Object.assign(object[property], object2[property2]);
  return object;
}
function tile2long(x,z) {
  return (x/Math.pow(2,z)*360-180);
 }
function tile2lat(y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
 }
function getTiles(bottom, left, top, right, zoomlevel){
   var bbox = {
     bottom : bottom,
     left : left,
     top : top,
     right : right
   };

   var zoom = zoomlevel;
   return t.tilesInBbox(bbox, zoom);
}
function haversineDistance(lon1, lat1, lon2, lat2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var R = 6371; // km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2)
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d*1000;
}
