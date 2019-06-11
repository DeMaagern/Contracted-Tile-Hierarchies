// Merge 2 JSON objects together
function mergeJson(object, property, object2, property2) {
  Object.assign(object[property], object2[property2]);
  return object;
} // Compare function used by the priorityQueue


function edgeDifferenceCompareFunction(a, b) {
  //return a.edgeDifference < b.edgeDifference ? -1 : a.edgeDifference > b.edgeDifference ? 1 : 0;
  return a.edgeDifference < b.edgeDifference ? -1 : a.edgeDifference > b.edgeDifference ? 1 : 0;
}

function compareWithZoomLevelPriority(a, b) {
  if (a.zoomLevel != undefined && b.zoomLevel != undefined) {
    if (a.zoomLevel < b.zoomLevel) {
      return -1;
    } else if (a.zoomLevel > b.zoomLevel) {
      return 1;
    } else {
      return a.totalWeight < b.totalWeight ? -1 : a.totalWeight > b.totalWeight ? 1 : 0;
    }
  }

  if (a.zoomLevel != undefined && b.zoomLevel == undefined) {
    return -1;
  }

  if (a.zoomLevel == undefined && b.zoomLevel != undefined) {
    return 1;
  } else {
    return 0;
  }
}

function compareZoomLevelAndAStar(a, b) {
  if (a.zoomLevel != undefined && b.zoomLevel != undefined) {
    if (a.zoomLevel < b.zoomLevel && a.distance + a.totalWeight > (b.distance + b.totalWeight) * 2) {
      return -1;
    } else if (a.zoomLevel > b.zoomLevel) {
      return 1;
    } else {
      return a.distance + a.totalWeight < b.distance + b.totalWeight ? -1 : a.distance + a.totalWeight > b.distance + b.totalWeight ? 1 : 0;
    }
  }

  if (a.zoomLevel != undefined) {
    return -1;
  }

  if (b.zoomLevel != undefined) {
    return 1;
  }

  if (a.distance + a.totalWeight < b.distance + b.totalWeight) {
    return -1;
  }

  return 1;
}

function haversineDistance(lon1, lat1, lon2, lat2) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var R = 6371; // km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d * 1000;
}

class Graph {
  constructor(isDirected = true, logStatus = false) {
    this.nodes = {};
    this.edges = {};
    this.directed = isDirected;
    this.logging = logStatus;
  } // Deep copy for a graph


  copyConstructor(graph) {
    // Copy values
    this.directed = graph.directed;
    this.logging = graph.logging; // Copy node object property

    for (var node in graph.nodes) {
      var newNode = new Node(node);
      newNode.copyConstructor(graph.nodes[node]);
      this.addNode(newNode);
    } // Copy edge object property


    for (var edge in graph.edges) {
      var newEdge = new Edge(graph.edges[edge].from, graph.edges[edge].to, graph.edges[edge].weight, graph.edges[edge].osmId);
      newEdge.copyConstructor(graph.edges[edge]);
      this.addEdge(newEdge);
    }
  } // Get operator for retrieving nodes and edges. Not used a.t.m.


  get getNodes() {
    return this.nodes;
  }

  get getEdges() {
    return this.edges;
  } // Add a node to the graph


  addNode(newNode) {
    // Node object to add to the Graph
    if (!this.nodes[newNode.id]) {
      this.nodes[newNode.id] = newNode;
    }
  } // Add an edge to the graph


  addEdge(newEdge) {
    // Edge object to add to the Graph
    // Do start and end node exist?
    if (this.nodes[newEdge.from] && this.nodes[newEdge.to]) {
      /*
        Adding AB, a edge from A to B
         Directed:     Forward edge AB ( A -> B ) + forward edge BA ( B -> A ) in reverse edges
         Undirected:   Forward edge AB ( A -> B ) + Reverse edge BA ( B -> A )
                      Forward edge BA ( B -> A ) + Reverse edge AB ( B -> A )
      */
      if (this.edges[newEdge.id]) {
        this.nodes[newEdge.from].edges.forward[newEdge.id] = newEdge.weight;
        this.nodes[newEdge.to].edges.reverse[newEdge.id] = newEdge.weight;

        if (!this.directed) {
          var reverseEdge = new Edge(newEdge.to, newEdge.from, newEdge.weight, newEdge.osmId);
          this.nodes[reverseEdge.from].edges.forward[reverseEdge.id] = reverseEdge.weight; // A <- B (R)

          this.nodes[reverseEdge.to].edges.reverse[reverseEdge.id] = newEdge.weight;
        }

        return false;
      } // Add the forward edge to the source and set it neighbour
      // A -> B


      this.nodes[newEdge.from].edges.forward[newEdge.id] = newEdge.weight;
      this.nodes[newEdge.from].neighbours[newEdge.to] = newEdge.id;
      this.edges[newEdge.id] = newEdge; // Add the reverse edge to the destination. This information is needed for the bidirectional Dijkstra algorithm
      // B <- A

      this.nodes[newEdge.to].edges.reverse[newEdge.id] = newEdge.weight;
      this.nodes[newEdge.to].neighbours[newEdge.from] = newEdge.id; // If the graph is undirected, we need to add a forward edge to the destination and a reverse edge to the source

      if (!this.directed) {
        // Create the backward edge (from destination to source)
        // B <- A (R)
        var reverseEdge = new Edge(newEdge.to, newEdge.from, newEdge.weight, newEdge.osmId);
        reverseEdge.contracts = newEdge.contracts; // Add forward edge from the original destination
        // B -> A

        this.nodes[reverseEdge.from].edges.forward[reverseEdge.id] = reverseEdge.weight; // A <- B (R)

        this.nodes[reverseEdge.to].edges.reverse[reverseEdge.id] = newEdge.weight;
        this.edges[reverseEdge.id] = reverseEdge;
      }

      return true;
    } else {
      console.error("Edge " + newEdge.id + " has not been added. Reason: Start or end node does not exist");
    }
  } // Remove a node from the Graph


  removeNode(nodeId) {
    // nodeId: id of the node to be removed
    // Does the node exist in the current graph
    if (this.nodes[nodeId]) {
      // Remove all edges incident the node that has to be removed
      for (var edgeId in this.nodes[nodeId].edges.forward) {
        // remove the edge
        this.removeEdge(edgeId);
      }

      for (var edgeId in this.nodes[nodeId].edges.reverse) {
        // remove the edge
        this.removeEdge(edgeId);
      } // Delete the node itself


      delete this.nodes[nodeId];
    }
  } // NOT FINISHED?
  // Remove an edge from the Graph


  removeEdge(edgeId) {
    // edgeId: id of the edge to be removed
    var from = this.edges[edgeId].from;
    var to = this.edges[edgeId].to; // Delete the edge from the startnode

    delete this.nodes[from].edges.forward[edgeId];
    delete this.nodes[to].edges.reverse[edgeId];
    delete this.nodes[from].neighbours[to];
    delete this.nodes[to].neighbours[from]; // Delete the edge from the collection of edges

    delete this.edges[edgeId];
  } // Merge a raph with the current Graph


  addGraphToGraph(graph) {
    // The new weights (edges) and coordinates (nodes) are overwritten
    for (var nodeId in graph.nodes) {
      var node = new Node(graph.nodes[nodeId].id, graph.nodes[nodeId].x, graph.nodes[nodeId].y, graph.nodes[nodeId].isContractable);
      node.copyConstructor(graph.nodes[nodeId]);
      this.addNode(node);
    }

    for (var edgeId in graph.edges) {
      var edge = new Edge(graph.edges[edgeId].from, graph.edges[edgeId].to, graph.edges[edgeId].weight, graph.edges[edgeId].osmId, graph.edges[edgeId].zoomLevel);
      edge.copyConstructor(graph.edges[edgeId]);
      this.addEdge(edge);
    }
  } // An export function to export this Graph in a JSON-LD format to write to disk and publish


  exportToJson(x, y, zoomLevel) {
    var template = '{"@context": {"tiles": "https://w3id.org/tree/terms#","hydra": "http://www.w3.org/ns/hydra/core#","osm": "https://w3id.org/openstreetmap/terms#","rdfs": "http://www.w3.org/2000/01/rdf-schema#","geo": "http://www.w3.org/2003/01/geo/wgs84_pos#","dcterms": "http://purl.org/dc/terms/","dcterms:license": {"@type": "@id"},"hydra:variableRepresentation": {"@type": "@id"},"hydra:property": {"@type": "@id"},"osm:nodes": {"@container": "@list","@type": "@id"}},"dcterms:isPartOf": {"@id": "https://tiles.openplanner.team/planet","@type": "hydra:Collection","dcterms:license": "http://opendatacommons.org/licenses/odbl/1-0/","dcterms:rights": "http://www.openstreetmap.org/copyright","hydra:search": {"@type": "hydra:IriTemplate","hydra:template": "https://tiles.openplanner.team/planet/' + zoomLevel + '/{x}/{y}","hydra:variableRepresentation": "hydra:BasicRepresentation","hydra:mapping": [{"@type": "hydra:IriTemplateMapping","hydra:variable": "x","hydra:property": "tiles:longitudeTile","hydra:required": true}, {"@type": "hydra:IriTemplateMapping","hydra:variable": "y","hydra:property": "tiles:latitudeTile","hydra:required": true}]}},"@graph": []}';
    var tile = JSON.parse(template);
    tile["@graph"] = [];

    for (var nodeId in this.nodes) {
      tile["@graph"].push(this.nodes[nodeId].toJson());
    }

    var processEdges = {};

    for (var edgeId in this.edges) {
      if (processEdges[edgeId]) {
        continue;
      } // Determine if edge is bidirectional and if it is a shortcut or not (wayId)


      var edge = this.edges[edgeId];
      var reverseEdge = edge.getReverseEdge();

      if (this.edges[reverseEdge.id]) {
        // Reverse edge exists
        tile["@graph"].push(this.edges[edgeId].toJson(false, zoomLevel));
        processEdges[edgeId] = true;
        processEdges[reverseEdge] = true;
      } else {
        tile["@graph"].push(this.edges[edgeId].toJson(true, zoomLevel));
        processEdges[edgeId] = true;
      }
    }

    processEdges = {};
    return tile;
  } // Unidirectional Dijkstra implementation


  ShortestPath(startId, endId, nodeToSkip) {
    // Variable initialisations
    // DiscoveredCount keeps track on the amount of nodes that are pushed to the queue.
    var discoveredCount = 0; // Make a queue

    var queue = new TinyQueue([]); // Discovered collection

    var discovered = {};

    if (nodeToSkip) {
      discovered[nodeToSkip] = true;
    } // Populate queue with initial node
    // Make a new node instance. Otherwise the original node is also manipulated (references)


    var newNode = new Node(startId);
    newNode.edges.forward = this.nodes[startId].edges.forward;
    newNode.edges.reverse = this.nodes[startId].edges.reverse; // Add a starting total weight to the starting node

    newNode.totalWeight = 0; // No previous nodes

    newNode.previous = ""; // Add node to Queue

    queue.push(newNode); // While nodes are populating the queue

    while (queue.length > 0) {
      // Get the closest node
      var closestNode = queue.pop(); // If the node, popped from the stack, is the destination, algorithm complete

      if (closestNode.id == endId) {
        closestNode.previous += " " + closestNode.id;
        return closestNode;
      } // If the node has been discovered before, the current path to this node is not the shortest
      // Discard node and continue


      if (discovered[closestNode.id] != undefined) {
        continue;
      } // Set node to discovered. This also prevents edges connected to itself (loops). Even negative edge weihts??


      discovered[closestNode.id] = true; // Add all neighbours to the queue

      var incidentEdges = closestNode.edges.forward;

      for (var edgeId in incidentEdges) {
        // Get the neighbour
        var dest = this.nodes[this.edges[edgeId].to]; // Make new instance of the neighbour

        var neighbour = new Node(dest.id);
        neighbour.edges.forward = dest.edges.forward;
        neighbour.edges.reverse = dest.edges.reverse; // Add the current weight to the neighbour + the weight that is added to reach the neighbour

        neighbour.totalWeight = closestNode.totalWeight + this.edges[edgeId].weight;
        neighbour.previous = closestNode.previous + " " + closestNode.id; // Add node to the queue

        queue.push(neighbour);
        discoveredCount++;
      }
    }
  } // Bidirectional Dijkstra implementation


  ShortestPathBiDirectional(startId, endId, nodeToSkip = undefined) {
    var discoveredCount = 0;
    var startQueue = new TinyQueue([], compareZoomLevelAndAStar);
    var endQueue = new TinyQueue([], compareZoomLevelAndAStar);
    var startDiscovered = {};
    var endDiscovered = {};

    if (nodeToSkip) {
      startDiscovered[nodeToSkip] = true;
      endDiscovered[nodeToSkip] = true;
    }

    var newStartNode = new Node(startId);
    newStartNode.copyConstructor(this.nodes[startId]);
    var newEndNode = new Node(endId);
    newEndNode.copyConstructor(this.nodes[endId]);
    newEndNode.copyConstructor(this.nodes[endId]);
    var sourceId = startId;
    var destId = endId; // Add a starting total weight to the starting node

    newStartNode.totalWeight = 0;
    newEndNode.totalWeight = 0; // No previous nodes

    newStartNode.previous = "";
    newEndNode.previous = ""; // Add node to Queue

    startQueue.push(newStartNode);
    endQueue.push(newEndNode);
    var counter = 0;
    var queue = startQueue;
    var otherDiscovered = endDiscovered;
    var ownDiscovered = startDiscovered;

    while (queue.length > 0) {
      // Get the closest node
      var closestNode = queue.pop();

      if (otherDiscovered[closestNode.id] != undefined) {
        this.log("Shortest path found");
        closestNode.previous += " " + closestNode.id;
        var shortest = {};

        if (counter % 2 == 0) {
          shortest.previous = closestNode.previous + " " + otherDiscovered[closestNode.id].previous;
        } else {
          shortest.previous = otherDiscovered[closestNode.id].previous + " " + closestNode.previous;
        }

        shortest.totalWeight = parseInt(closestNode.totalWeight) + parseInt(otherDiscovered[closestNode.id].totalWeight);
        return shortest;
      } // If already discovered


      if (ownDiscovered[closestNode.id] != undefined) {
        continue;
      }

      ownDiscovered[closestNode.id] = closestNode;
      var incidentEdges;

      if (counter % 2 == 1) {
        // Reverse edges
        incidentEdges = closestNode.edges.reverse;
      } else {
        // Forward edges
        incidentEdges = closestNode.edges.forward;
      }

      for (var edgeId in incidentEdges) {
        var dest = this.nodes[this.edges[edgeId].to]; // Get the neighbour

        if (counter % 2 == 1) {
          // Reverse edges
          dest = this.nodes[this.edges[edgeId].from];
        } // Make new instance of the neighbour


        var neighbour = new Node(dest.id);
        neighbour.edges.forward = dest.edges.forward;
        neighbour.edges.reverse = dest.edges.reverse; // Add the current weight to the neighbour + the weight that is added to reach the neighbour

        neighbour.totalWeight = closestNode.totalWeight + this.edges[edgeId].weight; // Heuristics to improve routing
        // Distance to destination and zoomLevel of the connecting edge

        neighbour.distance = haversineDistance(this.nodes[destId].x, this.nodes[destId].y, neighbour.x, neighbour.y);
        neighbour.zoomLevel = this.edges[edgeId].zoomLevel;
        neighbour.previous = closestNode.previous + " " + closestNode.id;

        if (counter % 2 == 1) {
          // Reverse edges
          neighbour.previous = closestNode.id + " " + closestNode.previous;
        } // Add node to the queue


        queue.push(neighbour);
        discoveredCount++;
      }

      if (counter % 2 == 0) {
        queue = endQueue;
        otherDiscovered = startDiscovered;
        ownDiscovered = endDiscovered;
        var help = sourceId;
        sourceId = destId;
        destId = help;
      } else {
        queue = startQueue;
        otherDiscovered = endDiscovered;
        ownDiscovered = startDiscovered;
        var help = destId;
        destId = sourceId;
        sourceId = help;
      }

      counter++;
    }

    this.log("Empty queue");
  } // Calculate a heuristic for a node. It represents how interesting it is to contract a node


  calculateEdgeDifferenceForNode(nodeId) {
    // The amount of possible shortcuts can be calculated using the incomming and outgoing edges.
    // By using the formula: (incomming * outgoing) we can achieve a number
    // When edges in both directions are possible, the bidirectional edges are also counted as a shortcut.
    // We also count a shortcut from a node n to itself, which is not beneficial in any way
    // As a result, we must check howmuch bidirectional edges are present, to take this issue into account
    // New formula: EdgeDifference(n) = (incomming * outgoing) - bidirectional
    // nodeId: The node for which the edge difference must be calculated
    // The node for which we want to calculate the edge difference
    var node = this.nodes[nodeId]; // Get the amount of incomming and outgoing edges

    var incidentEdgeCount = Object.keys(node.edges.reverse).length;
    var outGoingEdgeCount = Object.keys(node.edges.forward).length; // The total count of edges for this node

    var currentEdgeCount = outGoingEdgeCount + incidentEdgeCount; // No shortcut possible

    if (outGoingEdgeCount == 0 || incidentEdgeCount == 0) {
      node.edgeDifference = currentEdgeCount;
      return;
    }

    var bidirectionalCount = 0; // For all incomming edges ...

    for (var edgeId in node.edges.reverse) {
      if (node.edges.forward[edgeId]) {
        // Edge is bidirectional
        bidirectionalCount++;
      }
    } // The amount of shortcuts to be added to the graph if none already existing


    var possibleEdges = incidentEdgeCount * outGoingEdgeCount - bidirectionalCount;
    var alreadyPresent = 0;

    for (var neighbourId in node.neighbours) {
      for (var neighbourId2 in node.neighbours) {
        if (neighbourId == neighbourId2) {
          continue;
        } // EDIT


        var incidentId = neighbourId + ";" + node.id;
        var outgoingId = node.id + ";" + neighbourId2;
        var shortcutId = neighbourId + ";" + neighbourId2; // If:
        // The first neighbour has a forward edge to the node that we want to contract
        // The node we want to contract has a forward edge to the second neighbour
        // The first neighbour has a edge to the second neighbour

        if (this.nodes[neighbourId].edges.forward[incidentId] && node.edges.forward[outgoingId] && this.nodes[neighbourId].edges.forward[shortcutId]) {
          alreadyPresent++;
        }
      }
    } // The difference in edges is:
    // The amount of possible shortcuts introduced - the shortcuts already already present
    // - The current incomming and outgoing edges


    this.nodes[node.id].edgeDifference = possibleEdges - alreadyPresent - currentEdgeCount;
  } // Calculate the edge difference for all nodes in the Graph


  calculateEdgeDifference() {
    // Iterate all nodes and calculate edge difference
    for (var nodeId in this.nodes) {
      this.calculateEdgeDifferenceForNode(nodeId);
      this.log("NodeId: " + nodeId + " - " + this.nodes[nodeId].edgeDifference);
    }
  } // Contract the current Graph


  contractGraph(zoomLevel) {
    var contracted = {};
    this.log(this.nodes);
    var queue = new TinyQueue(Object.values(this.nodes), edgeDifferenceCompareFunction);
    var counter = queue.length;
    this.log("Starting contraction - count: " + counter);

    while (queue.length > 0) {
      var topNode = queue.pop(); // Contract the node

      this.log("Contracting " + topNode.id + " with an edge difference of " + topNode.edgeDifference); // If node only has 1 or 0 neighbours (dead-end street)
      // If the node has been contracted before, skip. Else set as contracted

      if (contracted[topNode.id]) {
        continue;
      }

      if (this.nodes[topNode.id].timesUpdated != topNode.updateVersion) {
        this.log(topNode.id + " times updated and updateVersion is not correct");
        continue;
      }

      this.log(topNode.id + " has been discovered");
      contracted[topNode.id] = true;

      if (!topNode.isContractable) {
        continue;
      }

      if (Object.keys(topNode.neighbours).length < 2) {
        this.log("Only 1 or 0 neighbours: " + topNode.id);
        contracted[topNode.id];
      }

      if (topNode.edgeDifference >= 0) {
        continue;
      } // For each neighbour a of the node n that we want to contract


      for (var firstNeighbour in topNode.neighbours) {
        // If the node n has been contracted before, skip. We are only interested in the uncontracted neighbours
        // If the node is not up-to-date, we allow multiple version of the same node to be added to the queue
        // we do not use it, because the outdated information may wrongly influence the contraction sorting order
        if (contracted[firstNeighbour]) {
          this.log("Neighbour " + firstNeighbour + " has been contracted before");
          continue;
        } // For each neighbour b of the node n that we want to contract


        for (var secondNeighbour in topNode.neighbours) {
          // If the second neighbour b is the same as the first neighbour a or has been contracted already, skip.
          if (firstNeighbour == secondNeighbour || contracted[secondNeighbour]) {
            continue;
          } // Check if firstNeighbour is a forward and secondNeighbour is a reverse edge
          // Else, skip, because no path is possible in a a directed graph


          var id1 = firstNeighbour + ";" + topNode.id;
          var id2 = topNode.id + ";" + secondNeighbour;

          if (this.nodes[firstNeighbour].edges.forward[id1] == undefined || this.nodes[topNode.id].edges.forward[id2] == undefined) {
            // This connection does not work
            this.log("Connection does not work");
            continue;
          } // Search for witness paths. E.g. calculate the shortest distance between the 2 neighbours (a and b)
          // If the smallest weight from a -> b is smaller than a -> n -> b, we found a witness path and we will not introduce a shortcut


          var weightThroughN = this.edges[topNode.neighbours[firstNeighbour]].weight + this.edges[topNode.neighbours[secondNeighbour]].weight; //topNode.neighbours[firstNeighbour] + topNode.neighbours[secondNeighbour];

          var shortestDistanceNode = this.ShortestPath(firstNeighbour, secondNeighbour, topNode.id);
          var shortestDistance = weightThroughN;

          if (shortestDistanceNode != undefined && shortestDistanceNode.totalWeight < weightThroughN) {
            shortestDistance = shortestDistanceNode.totalWeight;
          }

          var shortcutEdge = new Edge(firstNeighbour, secondNeighbour, shortestDistance);
          shortcutEdge.contracts = topNode.id;
          shortcutEdge.zoomLevel = zoomLevel;
          this.addEdge(shortcutEdge);
          this.log("Make shortcut: " + shortcutEdge.id);
          this.edges[this.nodes[firstNeighbour].neighbours[secondNeighbour]].contracts = topNode.id; // We still need to update the neighbours, because the layout changed.
          // For ease of programming, and maybe even the best solution
          // Create a new node that is a copy of the altered neighbour and add it to the queue again.
          // Popping a node for the second time is not bad, because we check if the node has already been contracted
          // To make sure we are using the latest "version" of this node, we add a version to the neighbours.
          // If, in the future, a neighbour gets popped, the version of that node must match the latest version.
          // If it does not match, the weights and edge information may not be up-to-date and can wrongly influence the contraction sorting order
          // Increment both neighbours their timesUpdated

          this.nodes[firstNeighbour].timesUpdated++;
          this.nodes[secondNeighbour].timesUpdated++;
          var newFirst = new Node(firstNeighbour);
          newFirst.copyConstructor(this.nodes[firstNeighbour]);
          newFirst.updateVersion = this.nodes[firstNeighbour].timesUpdated;
          var newSecond = new Node(secondNeighbour);
          newSecond.copyConstructor(this.nodes[secondNeighbour]);
          newSecond.updateVersion = this.nodes[secondNeighbour].timesUpdated; // Push updates neighbours with the up-to-date edge difference

          this.calculateEdgeDifferenceForNode(newFirst.id);
          this.calculateEdgeDifferenceForNode(newSecond.id);
          queue.push(newFirst);
          queue.push(newSecond);
        }
      } // Even if no shorcut is introduced, apply contracted logic
      // Assign the highest numeric value of levels that has not been taken = assign counter value. This is not necessary?


      this.log("Set contraction level for node: " + topNode.id + " to: " + counter);
      counter--;
    }
  } // Debug logging. Only if verbose mode is enables (logStats = true).


  log(message) {
    if (this.logging == true) {
      console.log(message);
    }
  } // Remove al intermediate nodes in the graph. Only keep the intersections


  simplifyGraph() {
    for (var nodeId in this.nodes) {
      if (Object.keys(this.nodes[nodeId].neighbours).length == 2) {
        // simplifyGraph
        for (var incEdgeId in this.nodes[nodeId].edges.reverse) {
          for (var outEdgeId in this.nodes[nodeId].edges.forward) {
            var incEdge = this.edges[incEdgeId];
            var outEdge = this.edges[outEdgeId];
            var newFrom = incEdge.from;
            var newTo = outEdge.to;

            if (newFrom == newTo) {
              continue;
            }

            var newWeight = incEdge.weight + outEdge.weight;

            if (incEdge != undefined && incEdge.weight != 0 && outEdge != undefined && outEdge.weight != 0) {
              newWeight = haversineDistance(this.nodes[newFrom].x, this.nodes[newFrom].y, this.nodes[nodeId].x, this.nodes[nodeId].y) + haversineDistance(this.nodes[nodeId].x, this.nodes[nodeId].y, this.nodes[newTo].x, this.nodes[newTo].y);
            }

            var newEdge = new Edge(newFrom, newTo, parseInt(newWeight), incEdge.osmId);
            newEdge.shortcut = true;
            this.addEdge(newEdge);
            var newReverseEdge = new Edge(newTo, newFrom, parseInt(newWeight), incEdge.osmId);
            newEdge.shortcut = true;
            this.addEdge(newEdge);
          }
        }

        this.removeNode(nodeId);
      }
    }
  } // Return a set of remaining nodes and edges.


  getRemaining() {
    // This is used to determine the new set of edges and nodes when calculating the next zoom-level, based on this one.
    // First, all shortcuts are determined.
    // From this, we gather all nodes connected to these shortcuts
    // Lastly, all edges connected between 2 nodes that have a shortcut will be added
    var remainingNodes = {};
    var remainingNeighbours = {};
    console.log("Before: " + Object.keys(this.nodes).length);

    for (var nodeId in this.nodes) {
      var node = this.nodes[nodeId];

      if (!node.isContractable) {
        remainingNodes[nodeId] = true; // Add all neighbours

        for (var neighbourId in node.neighbours) {
          remainingNeighbours[neighbourId] = true;
        }
      }
    }

    console.log("Remaining count after stage 1: " + Object.keys(remainingNodes).length);
    var countFailed = 0;
    var shortestPathNodes = {};

    for (var nodeId1 in remainingNodes) {
      for (var nodeId2 in remainingNodes) {
        if (nodeId1 == nodeId2) {
          continue;
        }

        var nodes = this.ShortestPathBiDirectional(nodeId1, nodeId2);

        if (nodes && nodes.previous) {
          var listOfNodes = nodes.previous.split(" ");

          for (var i = 0; i < listOfNodes.length; i++) {
            shortestPathNodes[listOfNodes[i]] = true;
          }
        } else {
          countFailed++;
        }
      }
    }

    console.log("Failed attempts: " + countFailed);
    remainingNodes = Object.assign({}, remainingNodes, shortestPathNodes, remainingNeighbours);
    console.log("Remaining count after stage 2: " + Object.keys(remainingNodes).length); // Iterate all shortcut-edges and see which nodes are still remaining

    for (var edgeId in this.edges) {
      // If the edge contracts a node
      var edge = this.edges[edgeId];

      if (edge.contracts != "") {
        remainingNodes[edge.from] = true;
        remainingNodes[edge.to] = true;
      }
    }

    console.log("Remaining count after stage 3: " + Object.keys(remainingNodes).length);

    for (var nodeId in this.nodes) {
      if (!remainingNodes[nodeId]) {
        this.removeNode(nodeId);
      }
    }

    console.log("After: " + Object.keys(this.nodes).length);
  }

}

class Node {
  // Constructor to create a node
  constructor(id, x = "", y = "", contractable = true) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.neighbours = {};
    this.edges = {};
    this.edges.forward = {};
    this.edges.reverse = {}; //this.contractedLevel = 0;

    this.timesUpdated = 0;
    this.updateVersion = 0;
    this.isContractable = contractable;
  } // Deep copy method


  copyConstructor(node) {
    this.id = node.id;
    this.x = node.x;
    this.y = node.y;
    this.neighbours = JSON.parse(JSON.stringify(node.neighbours));
    this.edges = {};
    this.edges.forward = JSON.parse(JSON.stringify(node.edges.forward));
    this.edges.reverse = JSON.parse(JSON.stringify(node.edges.reverse)); //this.contractedLevel = node.contractedLevel;

    this.timesUpdated = node.timesUpdated;

    if (node.edgeDifference) {
      this.edgeDifference = node.edgeDifference;
    }

    this.isContractable = node.isContractable;
  } // JSON export function


  toJson() {
    var exported = {};
    exported["@type"] = "osm:Node";
    exported["@id"] = this.id;
    exported["geo:long"] = this.x;
    exported["geo:lat"] = this.y;
    return exported;
  }

}

class Edge {
  // Constructor to create an edge
  constructor(from, to, weight = 1, wayId = undefined, zl = undefined) {
    if (!wayId) {
      this.osmId = wayId;
    }

    this.id = from + ";" + to;
    this.from = from;
    this.to = to;
    this.weight = weight;
    this.contracts = "";
    this.zoomLevel = zl;
  } // Deep copy method


  copyConstructor(edge) {
    this.id = edge.id;
    this.from = edge.from;
    this.to = edge.to;
    this.weight = edge.weight;
    this.contracts = edge.contracts;
    this.osmId = edge.osmId;
  } // JSON export function


  toJson(isOneWay = true, zoomLevel) {
    var exported = {};

    if (this.osmId) {
      exported["@id"] = this.osmId;
    } else {
      exported["@id"] = this.id;
    }

    if (isOneWay) {
      exported["osm:oneway"] = "osm:yes";
    }

    exported["osm:hasNodes"] = [this.from, this.to];

    if (this.contracts != "") {
      exported["rt:shortcut"] = this.contracts;
      exported["@type"] = "rt:shortcut";
    }

    if (this.zoomLevel != undefined) {
      exported["rt:zoomLevel"] = this.zoomLevel;
    } else {
      exported["@type"] = "osm:Way";
    }

    exported["weight"] = this.weight;
    return exported;
  } // Get the reverse edge of this edge (forward edge from destination to source)


  getReverseEdge() {
    var reverse = new Edge(this.to, this.from, this.weight, this.osmId);
    reverse.contracts = this.contracts;
    return reverse;
  }

}
