function edgeDifferenceCompareFunction(a, b){
  return a.edgeDifference < b.edgeDifference ? -1 : a.edgeDifference > b.edgeDifference ? 1 : 0;
}

class Graph {
  constructor(isDirected = false){
    this.nodes = {};
    this.edges = {};
    this.directed = isDirected;
  }
  get getNodes(){
    return this.nodes;
  }
  get getEdges(){
    return this.edges;
  }
  addNode(newNode){
    this.nodes[newNode.id] = newNode;
  }
  addEdge(newEdge){
    // Do start and end node exist?
    if(this.nodes[newEdge.from] && this.nodes[newEdge.to]){

      /*
        Adding AB, a edge from A to B

        Directed:     Forward edge AB ( A -> B ) + Reverse edge BA ( B -> A )

        Undirected:   Forward edge AB ( A -> B ) + Reverse edge BA ( B -> A )
                      Forward edge BA ( B -> A ) + Reverse edge AB ( B -> A )
      */

      // Create the backward edge (from destination to source)
      // B <- A (R)
      var reverseEdge = new Edge(newEdge.to, newEdge.from, newEdge.weight);

      // Add the forward edge to the source and set it neighbour
      // A -> B
      this.nodes[newEdge.from].edges.forward[newEdge.id] = newEdge.weight;
      this.nodes[newEdge.from].neighbours[newEdge.to] = newEdge.id;
      this.edges[newEdge.id] = newEdge;

      // Add the reverse edge to the destination. This information is needed for the bidirectional Dijkstra algorithm
      // B <- A
      this.nodes[reverseEdge.from].edges.reverse[reverseEdge.id] = reverseEdge.weight;
      // Set as neighbour? Not sure of this
      //this.nodes[reverseEdge.from].neighbours[reverseEdge.to] = reverseEdge.id;
      this.edges[reverseEdge.id] = reverseEdge;

      // If the graph is undirected, we need to add a forward edge to the destination and a reverse edge to the source
      if(!this.directed){
        // Add forward edge from the original destination
        // B -> A
        this.nodes[newEdge.to].edges.forward[newEdge.id] = newEdge.weight;
        this.nodes[newEdge.to].neighbours[newEdge.from] = reverseEdge.id;
        // A <- B (R)
        this.nodes[reverseEdge.from].edges.forward[reverseEdge.id] = reverseEdge.weight;
      }
    }
    else{
      console.error("Edge " + newEdge.id + " has not been added. Reason: Start or end node does not exist");
    }
  }
  // Removing needs extra information (The neighbour needs to have its reverse connection removed)
  removeEdge(edgeId){
    // Does the edge exist in the current graph
    if(this.edges[edgeId]){
      // Delete the edge from the startnode
      delete this.nodes[this.edges[edgeId].from].edges.forward[edgeId];
      // If the graph is undirected, delete the reverse edge aswell
      if(!this.directed){
        delete this.nodes[this.Edge[edgeId].to].edges.reverse[edgeId];
      }
      // Delete the edge from the collection of edges
      delete this.edges[edgeId];
    }
    else {
      console.error("Edge with ID: " + edgeId + " does not exist in the current graph.");
    }
  }
  removeNode(nodeId){
    // Does the node exist in the current graph
    if(this.nodes[nodeId]){
      // Remove all edges incident the node that has to be removed
      for (var edge in this.nodes[nodeId].edges) {
        // remove the edge
        removeEdge(edge.id);
      }
      // Delete the node itself
      delete this.nodes[nodeId];
    }
  }

  // Unidirectional Dijkstra implementation
  ShortestPath(startId, endId, nodeToSkip){
    // Variable initialisations
    // DiscoveredCount keeps track on the amount of nodes that are pushed to the queue.
    var discoveredCount = 0;
    // Make a queue
    var queue = new TinyQueue();
    // Discovered collection
    var discovered = {};
    if(nodeToSkip){
      discovered[nodeToSkip] = true;
    }

    // Populate queue with initial node

    // Make a new node instance. Otherwise the original node is also manipulated (references)
    var newNode = new Node(startId);
    newNode.edges.forward = this.nodes[startId].edges.forward;
    newNode.edges.reverse = this.nodes[startId].edges.reverse;
    // Add a starting total weight to the starting node
    newNode.totalWeight = 0;
    // No previous nodes
    newNode.previous = "";
    // Add node to Queue
    queue.push(newNode);


    // While nodes are populating the queue
    while(queue.length > 0){

      // Get the closest node
      var closestNode = queue.pop();

      // If the node, popped from the stack, is the destination, algorithm complete
      if(closestNode.id == endId){
        closestNode.previous += " " + closestNode.id;
        return closestNode;
      }

      // If the node has been discovered before, the current path to this node is not the shortest
      // Discard node and continue
      if(discovered[closestNode.id] != undefined){
        continue;
      }
      // Set node to discovered. This also prevents edges connected to itself (loops). Even negative edge weihts??
      discovered[closestNode.id] = true;

      // Add all neighbours to the queue
      var incidentEdges = closestNode.edges.forward;
      for (var edgeId in incidentEdges) {

        // Get the neighbour
        var dest = this.nodes[this.edges[edgeId].to];

        // Make new instance of the neighbour
        var neighbour = new Node(dest.id);
        neighbour.edges.forward = dest.edges.forward;
        neighbour.edges.reverse = dest.edges.reverse;

        // Add the current weight to the neighbour + the weight that is added to reach the neighbour
        neighbour.totalWeight = closestNode.totalWeight + this.edges[edgeId].weight;
        neighbour.previous = closestNode.previous + " " + closestNode.id;

        // Add node to the queue
        queue.push(neighbour);
        discoveredCount++;
      }
    }
  }

  // Bidirectional Dijkstra implementation
  ShortestPathBiDirectional(startId, endId, nodeToSkip){
    var discoveredCount = 0;
    var startQueue = new TinyQueue();
    var endQueue = new TinyQueue();

    var startDiscovered = {};
    var endDiscovered = {};

    if(nodeToSkip){
      startDiscovered[nodeToSkip] = true;
      endDiscovered[nodeToSkip] = true;
    }

    var newStartNode = new Node(startId);
    newStartNode.edges.forward = this.nodes[startId].edges.forward;
    newStartNode.edges.reverse = this.nodes[startId].edges.reverse;

    var newEndNode = new Node(endId);
    newEndNode.edges.forward = this.nodes[endId].edges.forward;
    newEndNode.edges.reverse = this.nodes[endId].edges.reverse;

    // Add a starting total weight to the starting node
    newStartNode.totalWeight = 0;
    newEndNode.totalWeight = 0;
    // No previous nodes
    newStartNode.previous = "";
    newEndNode.previous = "";
    // Add node to Queue
    startQueue.push(newStartNode);
    endQueue.push(newEndNode);

    var counter = 0;
    var queue = startQueue;
    var otherDiscovered = endDiscovered;
    var ownDiscovered = startDiscovered;
    //console.log("Startqueue length: " + queue.length);
    while(queue.length > 0){
      // Get the closest node
      //console.log("Closest node");
      var closestNode = queue.pop();
      if(otherDiscovered[closestNode.id] != undefined){
        closestNode.previous += " " + closestNode.id;
        var shortest = {};
        shortest.prevA = closestNode.previous;
        shortest.prevB = otherDiscovered[closestNode.id].previous;
        return shortest;//Object.assign({}, closestNode, otherDiscovered[closestNode.id]);
      }
      // If already discovered
      if(ownDiscovered[closestNode.id] != undefined){
        continue;
      }

      ownDiscovered[closestNode.id] = closestNode;
      var incidentEdges;
      /*if(!this.directed){
        incidentEdges = Object.assign({}, closestNode.edges.forward, closestNode.edges.reverse);
      }
      else{

      }*/

      if(counter % 2 == 1){
        // Reverse edges
        incidentEdges = closestNode.edges.reverse;
      }
      else{
        // Forward edges
        incidentEdges = closestNode.edges.forward;
      }
      for (var edgeId in incidentEdges) {

        // Get the neighbour
        var dest = this.nodes[this.edges[edgeId].to];

        // Make new instance of the neighbour
        var neighbour = new Node(dest.id);
        neighbour.edges.forward = dest.edges.forward;
        neighbour.edges.reverse = dest.edges.reverse;

        // Add the current weight to the neighbour + the weight that is added to reach the neighbour
        neighbour.totalWeight = closestNode.totalWeight + this.edges[edgeId].weight;

        neighbour.previous = closestNode.previous + " " + closestNode.id;
        if(counter % 2 == 1){
          // Reverse edges
          neighbour.previous = closestNode.id + " " + closestNode.previous;
        }


        // Add node to the queue
        queue.push(neighbour);
        discoveredCount++;
      }
      if(counter % 2 == 0){
        queue = endQueue;
        otherDiscovered = startDiscovered;
        ownDiscovered = endDiscovered;
      }
      else{
        queue = startQueue;
        otherDiscovered = endDiscovered;
        ownDiscovered = startDiscovered;
      }
      counter++;
    }
  }

  calculateUndirectedEdgeDifference(){
    // Iterate all nodes and calculate edge difference
    for (var nodeId in this.nodes) {
      var node = this.nodes[nodeId];
      var incidentEdgeCount = Object.keys(node.edges.forward).length + Object.keys(node.edges.reverse).length;
      var removeCount = incidentEdgeCount;
      var addCount = 0;
      addCount = (incidentEdgeCount * (incidentEdgeCount - 1)) / 2;

      var alreadyPresent = 0;

      // For all neighbours
      for(var neighbourId in node.neighbours){
        // For all neighbours of this neighbour
        for(var distantNeighbourId in this.nodes[neighbourId].neighbours){
          // If this distant neighbour is a neighbour of our original node
          if(node.neighbours[distantNeighbourId]){
            // A connection exists between 2 neighbours of our node.
            alreadyPresent++;
          }
        }
      }
      // Because this is a undirected graph and we iterate every neighbour, neigbouring connection are counted in both direction
      // As a result, the bidirectional connection (= 2 Unidirectional connections in the underlying structure)
      // Are counted twice, resulting in double the amount of present connections.
      alreadyPresent = alreadyPresent / 2;
      addCount = addCount - alreadyPresent;
      this.nodes[node.id].edgeDifference = addCount - removeCount;
    }
  }

  calculateDirectedEdgeDifference(){
    console.error("calculateDirectedEdgeDifference: Not implemented exception.");
  }

  contractGraphUndirected(){
    this.calculateUndirectedEdgeDifference();
    console.log(this);
    var contracted = {};

    var queue = new TinyQueue(Object.values(this.nodes), edgeDifferenceCompareFunction);
    var counter = queue.length;
    console.log("Starting contraction - count: " + counter);
    while(counter > 0){
      var topNode = queue.pop();
      // Contract the node
      console.log("Contracting " + topNode.id + " with an edge difference of " + topNode.edgeDifference);
      // If the node has been contracted before, skip. Else set as contracted
      // By doing this, loops are eliminated?
      if(contracted[topNode.id]){
        console.log(topNode.id + " has already been contracted, skipping");
        continue;
      }
      else{
        contracted[topNode.id] = true;
      }
      console.log(topNode);
      // For each neighbour a of the node n that we want to contract
      for(var firstNeighbour in topNode.neighbours){
        // If the node n has been contracted before, skip. We are only interested in the uncontracted neighbours
        // If the node is not up-to-date, we allow multiple version of the same node to be added to the queue
        // we do not use it, because the outdated information may wrongly influence the contraction sorting order
        if(contracted[firstNeighbour] || (this.nodes[topNode.id].timesUpdated != topNode.updateVersion)){
          continue;
        }
        // For each neighbour b of the node n that we want to contract
        for(var secondNeighbour in topNode.neighbours){
          // If the second neighbour b is the same as the first neighbour a or has been contracted already, skip.
          if(firstNeighbour == secondNeighbour || contracted[secondNeighbour]){
            continue;
          }
          // Search for witness paths. E.g. calculate the shortest distance between the 2 neigbours (a and b)
          // If the smallest weight from a -> b is smaller than a -> n -> b, we found a witness path and we will not introduce a shortcut
          console.log("Neighbours " + firstNeighbour + " and " + secondNeighbour + " are being checked for witness paths");
          var weightThroughN = this.edges[topNode.neighbours[firstNeighbour]].weight + this.edges[topNode.neighbours[secondNeighbour]].weight//topNode.neighbours[firstNeighbour] + topNode.neighbours[secondNeighbour];
          var shortestDistance = this.ShortestPath(firstNeighbour, secondNeighbour, topNode.id).totalWeight;
          if(shortestDistance > weightThroughN){
            console.log("shortest path(" + shortestDistance + ") is longer than weightThroughN( " + weightThroughN + " )");
            // The witness path is longer than the connection. We introduce a shortcut

            // In any case, if the shortcut edge already exists, add the nodeId of the node it contracts.
            // This makes retrieving the path when querying easier, i think.

            // If the connection already exists
            if(this.nodes[firstNeighbour].neighbours[secondNeighbour] != undefined){
              console.log("Shortcut already exsists");
              // We have 2 edges. The forward and backward edge, because this is an undirected graph
              // We do not know which edge is a forwarde or backward edge in one of the 2 nodes. Therefore, iterate all possibilities
              var edgeId1 = this.nodes[firstNeighbour].neighbours[secondNeighbour];
              var edgeId2 = this.nodes[secondNeighbour].neighbours[firstNeighbour];
              if(this.nodes[firstNeighbour].edges.reverse[edgeId1]){
                this.nodes[firstNeighbour].edges.reverse[edgeId1] = weightThroughN;
              }
              if(this.nodes[firstNeighbour].edges.forward[edgeId2]){
                this.nodes[firstNeighbour].edges.forward[edgeId2] = weightThroughN;
              }
              if(this.nodes[secondNeighbour].edges.reverse[edgeId1]){
                this.nodes[secondNeighbour].edges.reverse[edgeId1] = weightThroughN;
              }
              if(this.nodes[secondNeighbour].edges.forward[edgeId2]){
                this.nodes[secondNeighbour].edges.forward[edgeId2] = weightThroughN;
              }
            }
            else {
              console.log("Adding shortcut");
              // Else, the connection does not exist yet.
              var shortcutEdge = new Edge(firstNeighbour, secondNeighbour, weightThroughN);
              this.addEdge(shortcutEdge);
            }
            this.edges[this.nodes[firstNeighbour].neighbours[secondNeighbour]].weight = weightThroughN;
            this.edges[this.nodes[firstNeighbour].neighbours[secondNeighbour]].contracts = topNode.id;
            this.edges[this.nodes[secondNeighbour].neighbours[firstNeighbour]].weight = weightThroughN;
            this.edges[this.nodes[secondNeighbour].neighbours[firstNeighbour]].contracts = topNode.id;
            // We still need to update the neighbours, because the layout changed.
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
            newFirst.copyContructor(this.nodes[firstNeighbour]);
            newFirst.updateVersion = this.nodes[firstNeighbour].timesUpdated;

            var newSecond = new Node(secondNeighbour);
            newSecond.copyContructor(this.nodes[secondNeighbour]);
            newSecond.updateVersion = this.nodes[secondNeighbour].timesUpdated;
            console.log("Pushing neighbours to queue");
            queue.push(newFirst);
            queue.push(newSecond);
          }
          else{
            console.log("shortest path( " + shortestDistance + " ) is shorter than weightThroughN( " + weightThroughN + " )");
          }

          // Even if no shorcut is introduced, apply contracted logic
          // Assign the highest numeric value of levels that has not been taken = assign counter value. This is not necessary?
          console.log("Assigning contraction level and decrement counter(" + counter-1 + ")");
          this.nodes[topNode.id].contractedLevel = counter;
          counter--;
        }
      }
    }
  }
}

class Node {
  constructor(id, x = "", y = ""){
    this.id = id;
    this.x = x;
    this.y = y;
    this.neighbours = {};
    this.edges = {};
    this.edges.forward = {};
    this.edges.reverse = {};
    this.contractedLevel = 0;
    this.timesUpdated = 0;
    this.updateVersion = 0;
  }

  copyContructor(node){
    this.id = node.id;
    this.x = node.x;
    this.y = node.y;
    this.neighbours = node.neighbours;
    this.edges = {};
    this.edges.forward = node.edges.forward;
    this.edges.reverse = node.edges.reverse;
    this.contractedLevel = node.contractedLevel;
    this.timesUpdated = node.timesUpdated;
    if(node.edgeDifference){
      this.edgeDifference = node.edgeDifference;
    }
  }
}

class Edge {
  constructor(from, to, weight = 1){
    this.id = from + "" + to;
    this.from = from;
    this.to = to;
    this.weight = weight;
    this.contracts = "";
  }
}
