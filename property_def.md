# Definition of attributes of JSON-LD

## Edges

### @id

The id provided by the Routable Tiles application or one generated with the following consitency:

```
@id_node_1;@id_node_2
```

### osm:oneway

osm:yes defines it is a one-way street

### osm:hasNodes

The nodes that are part of this edge or way

### rt:shortcut

Defines whether the edges is a shortcut or not.
The value is the @id of the node it contracts

### @type

The type of object. Can be a rt:shortcut, osm:Relation or osm:Way

### rt:zoomLevel

The zoom level on which this edge was created. This is not defined if it is an original edge on zoom level 14.

### weight

The weight of the edge as an integer in meter.

## Node

Remains unchanged

### @type

The type of the object

### @id

The id of the object

### geo:long

The longitude coordinates of the object

### geo:lat

The latitude coordinates of the object