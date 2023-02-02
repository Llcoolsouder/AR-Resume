/**
 * 3D graph layout
 *
 * Author:  Lonnie L. Souder II
 * Date:    01/17/2023
 */

export { GraphNode, EadesSpringEmbedderGraphLayout, Vector }

/**
 * Vector functions for convenience
 */
let Vector = {
  Add: function (v, u) {
    return v.map((value, index) => value + u[index])
  },

  Subtract: function (v, u) {
    return v.map((value, index) => value - u[index])
  },

  Multiply: function (v, u) {
    return v.map((value, index) => value * u[index])
  },

  Divide: function (v, u) {
    return v.map((value, index) => value / u[index])
  },

  ScalarMultiply: function (v, scalar) {
    return v.map((value) => value * scalar)
  },

  ScalarDivide: function (v, scalar) {
    return v.map((value) => value / scalar)
  }
}

class GraphNode {
  /**
   * Creates a GraphNode with data, connected to the nodes specified by
   * links at position (0, 0, 0)
   * @param {*} data Some data to store in the node
   * @param {GraphNode[]} links References to all nodes to which this node is connected
   */
  constructor(data, links) {
    this.data = data
    this.links = links
    this.position = [0, 0, 0]
    this.size = 0.25
  }

  /**
   * @param {GraphNode} other
   * @returns Vector pointing from other to this node
   */
  Subtract(other) {
    return Vector.Subtract(this.position, other.position)
  }

  /**
   * @param {GraphNode} other
   * @returns Distance between this and other
   */
  Distance(other) {
    return Math.sqrt(
      this.Subtract(other)
        .map((value) => Math.pow(value, 2))
        .reduce((a, b) => a + b)
    )
  }

  /**
   * @param {GraphNode} other
   * @param {Number} alternative
   * @returns distance between this and other or alternative if distance is 0
   */
  DistanceOr(other, alternative) {
    const distance = this.Distance(other)
    return distance === 0 ? alternative : distance
  }

  /**
   * @param {GraphNode} other
   * @returns Unit vector pointing from this to other
   */
  DirectionTo(other) {
    let magnitude = this.DistanceOr(other, 1)
    return other.Subtract(this).map((x) => x / magnitude)
  }

  /**
   * @param {GraphNode} other
   * @param {Number[]} alternative
   * @returns Unit vector pointing from this to other if unit vector is not a 0 vector else alternative
   */
  DirectionToOr(other, alternative) {
    let direction = this.DirectionTo(other)
    return direction.every((val) => val === 0) ? alternative : direction
  }

  /**
   * Moves a the node by given force vector
   * @param {Number[]} force vector giving direction and magnitude of move
   */
  Move(force) {
    this.position = Vector.Add(this.position, force)
  }
}

class SpringEmbedderGraphLayout {
  constructor() {
    this.coolDown = 0.99
    this.errorThreshold = 0.1
    this.maxIterations = 150
  }

  /**
   * Moves nodes based on a specified layout algorithm
   * @param {GraphNode[]} nodes List of nodes to modify
   */
  Layout(nodes) {
    let iteration = 0
    let error = Number.MAX_VALUE
    let coolingFactor = 1
    while (
      error > this.errorThreshold * nodes.length &&
      iteration < this.maxIterations
    ) {
      const forces = nodes.map((node) => {
        const attractiveForce = this.TotalAttractiveForce(node)
        const repulsiveForce = this.TotalRepulsiveForce(node, nodes)
        // console.log(`AttractiveForce:\t${attractiveForce}`)
        // console.log(`RepulsiveForce:\t${repulsiveForce}`)
        return Vector.Add(attractiveForce, repulsiveForce)
      })
      nodes.forEach((node, index) =>
        node.Move(forces[index].map((val) => val * coolingFactor))
      )
      error = forces
        .reduce((vecA, vecB) => Vector.Add(vecA, vecB))
        .reduce((a, b) => a + b)
      console.log(`Error: ${error}`)
      coolingFactor *= this.coolDown
      ++iteration
    }

    const minHeight = nodes
      .map((node) => node.position[1])
      .reduce((a, b) => Math.min(a, b), Number.MAX_VALUE)
    const center2D = R.pipe(
      R.map((n) => [n.position[0], n.position[2]]),
      R.reduce(Vector.Add, [0, 0]),
      R.partialRight(Vector.ScalarDivide, [nodes.length])
    )(nodes)

    nodes.forEach((node) => {
      node.position[0] -= center2D[0]
      node.position[1] -= minHeight
      node.position[2] -= center2D[1]
    })
  }

  /**
   * Computes attractive force on a GraphNode
   * @param {GraphNode} node
   */
  TotalAttractiveForce(node) {
    console.error('SpringEmbedderGraphLayout.AttractiveForce UNIMPLEMENTED')
  }

  /**
   * Computes repulsive force on a GraphNode
   * @param {GraphNode} node
   * @param {GraphNode[]} allNodes List of all other nodes in the graph
   */
  TotalRepulsiveForce(node, allNodes) {
    console.error('SpringEmbedderGraphLayout.RepulsiveForce UNIMPLEMENTED')
  }
}

class EadesSpringEmbedderGraphLayout extends SpringEmbedderGraphLayout {
  /**
   * Creates an Eades spring embedder with the given constants
   */
  constructor(repulsion, attraction, idealLength) {
    super()
    this.repulsion = repulsion
    this.attraction = attraction
    this.idealLength = idealLength
  }

  /**
   * Computes attractive force on a GraphNode
   * @param {GraphNode} node
   */
  TotalAttractiveForce(node) {
    const CalculateAttractionMagnitude = (o) => {
      return (
        this.attraction *
        Math.log10(node.DistanceOr(o, this.idealLength) / this.idealLength)
      )
    }

    let force = [0, 0, 0]
    for (const other of node.links) {
      const forceFromOther = R.pipe(
        () =>
          node.DirectionToOr(
            other,
            [0, 0, 0].map((_) => Math.random())
          ),
        R.partialRight(Vector.ScalarMultiply, [
          CalculateAttractionMagnitude(other)
        ]),
        R.partialRight(Vector.Subtract, [this.RepulsiveForce(node, other)])
      )()
      force = Vector.Add(forceFromOther, force)
    }
    return force
  }

  /**
   * Computes total repulsive force on a GraphNode from all other nodes
   * @param {GraphNode} node
   * @param {GraphNode[]} allNodes List of all other nodes in the graph
   */
  TotalRepulsiveForce(node, allNodes) {
    return R.reduce(
      Vector.Add,
      [0, 0, 0],
      allNodes.map((other) => this.RepulsiveForce(node, other))
    )
  }

  /**
   * Computes repulsive force on nodeA from nodeB
   * @param {GraphNode} nodeA
   * @param {GraphNode} nodeB
   */
  RepulsiveForce(nodeA, nodeB) {
    const magnitude = this.repulsion / Math.pow(nodeA.DistanceOr(nodeB, 1), 2)
    return R.pipe(
      () =>
        nodeB.DirectionToOr(
          nodeA,
          [0, 0, 0].map((_) => Math.random())
        ),
      R.partialRight(Vector.ScalarMultiply, [magnitude])
    )()
  }
}
