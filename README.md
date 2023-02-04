# AR Resume

This repo contains code for my augmented reality resume. The pattern below can be scanned by a mobile phone to open the site where this page is hosted and also serves as the marker for the AR app.

<p align="center">
  <img width="75%" src="https://github.com/Llcoolsouder/AR-Resume/blob/main/pattern-qr.png" alt="https://lonniesouderii.dev/AR">
</p>

## Components

### Eades Spring Embedder Graph Layout

The original, 2D version of this site used [cytoscape.js](https://js.cytoscape.org/) to perform the graph layout of my "skills graph." Unfortunately, this graph layout tool only works in 2D, so I wrote my own physics-based graph layout code based on the Eades Spring Embedder.

### AR.js

The marker tracking is totally handled by [AR.js](https://github.com/AR-js-org/AR.js). I simply had to add an object to the scene and generate my model on the marker.

### Ramda

Partially to explore a new Javascript library (since I don't find myself doing much Javascript in my work) and partially to attempt to clean up some ugly functions, I used [Ramda](https://ramdajs.com/) to gain access to functional programming paradigms. In particular, I needed currying, partial functions, and piping.
