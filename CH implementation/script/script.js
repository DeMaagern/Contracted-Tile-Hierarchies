//var t = require('tiles-in-bbox');
var graaf;
document.addEventListener('DOMContentLoaded', (event) => {

  var A = new Node("A");
  var B = new Node("B");
  var C = new Node("C");
  var D = new Node("D");
  var E = new Node("E");
  var F = new Node("F");
  var G = new Node("G");
  var H = new Node("H");
  var AB = new Edge("A", "B", 1);
  var AC = new Edge("A", "C", 2);
  var AD = new Edge("A", "D", 8);
  var BD = new Edge("B", "D", 7);
  var CD = new Edge("C", "D", 3);
  var DE = new Edge("D", "E", 2);
  var DF = new Edge("D", "F", 2);
  var EG = new Edge("E", "G", 1);
  var FG = new Edge("F", "G", 2);
  var GH = new Edge("G", "H", 1);

  graaf = new Graph(false);
  graaf.addNode(A);
  graaf.addNode(B);
  graaf.addNode(C);
  graaf.addNode(D);
  graaf.addNode(E);
  graaf.addNode(F);
  graaf.addNode(G);
  graaf.addNode(H);

  graaf.addEdge(AB);
  graaf.addEdge(AC);
  graaf.addEdge(AD);
  graaf.addEdge(BD);
  graaf.addEdge(CD);
  graaf.addEdge(DE);
  graaf.addEdge(DF);
  graaf.addEdge(EG);
  graaf.addEdge(FG);
  graaf.addEdge(GH);

  console.log(graaf);


  console.log("Unidirectional from A to H");
  var a = graaf.ShortestPath("A", "H");
  console.log(a);
  console.log("Bidirectional from A to H and vice-versa");
  var b = graaf.ShortestPathBiDirectional("A","H");
  console.log(b);

});
