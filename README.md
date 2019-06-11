# Contracted-Tile-Hierarchies
Dissertation and software implementation of Contraction Hierarchies for Routable Tiles.

This repository contains my dissertation for my master diploma of the Master of Science in Information Engineering Technology at the UGent university.

## Dependencies

- Node
- Npm
- Tiles on level 14

These dependencies must be already installed/present before you can run this project.

## Installing the project

Install the node modules through NPM, build the code and bundle the output.

On Linux:

```
bash install.sh
```

On Windows machines:

```
install.bat
```

Make sure that the directory: Webserver/tiles/14 contains all level 14 tiles that are needed! 

## Running the server

Execute the following command for the server to launch it.

```
node app-es5.js
```

## Running the client

Just open the index.html to open the client environment.

## Structure

- Client:
    * node_modules
    * script
    * style
- Webserver:
    * node_modules
    * tiles
        - 14
        - 13
        - ...

## Documentation

All code is rudimentary documented and not minified.

