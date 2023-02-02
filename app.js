/**
 * AR.js Sandbox App
 */

import {
  GraphNode,
  EadesSpringEmbedderGraphLayout,
  Vector
} from './graph-layout.js'

/**
 * Queries back-facing cameras from device
 * @returns Promise containing an array of back-facing, camera, media devices
 */
async function GetAvailableCameras() {
  const IsBackCamera = (device) =>
    device.kind == 'videoinput' && device.label.includes('facing back')
  return navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => devices.filter(IsBackCamera))
}

/**
 * Event handler for Camera Selector OnChange event.
 * This should change the camera to the newly chosen camera
 */
function HandleCameraSelectOnChange() {
  let cameraSelect = document.getElementById('camera-select')
  let video = document.getElementById('arjs-video')
  if (typeof video.srcObject !== 'undefined') {
    video.srcObject.getTracks().forEach((track) => track.stop())
  }
  let constraints = {
    video: { deviceId: { exact: cameraSelect.value } },
    audio: false
  }

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => (video.srcObject = stream))
    .catch((error) => console.log(error))
}

/**
 * Creates an AFrame sphere element with label, `text` parented to `parent` at `position`
 * @param {Element} parent Parent of object to be created
 * @param {Number[]} position 3D Euclidean coordinates of the new object
 * @param {Number} size Size of the sphere in meters
 * @param {string} text Label to display inside the object
 */
function CreateChildTextSphere(parent, position, size, text) {
  let sphere = document.createElement('a-entity')
  sphere.setAttribute('geometry', { primitive: 'sphere' })
  sphere.setAttribute('material', { color: '#b3b3cc', opacity: 0.5 })
  sphere.object3D.position.set(...position)
  sphere.object3D.scale.set(size, size, size)
  parent.appendChild(sphere)

  let sphereText = document.createElement('a-entity')
  sphereText.setAttribute('text', {
    value: text,
    align: 'center'
  })
  sphereText.object3D.scale.set(8, 8, 8)
  sphere.appendChild(sphereText)
}

/**
 * @param {GraphNode} from
 * @param {GraphNode} to
 * @returns The point on the surface of 'from', nearest to 'to' that is colinear with  vec from->to
 */
function GetColinearPointOnSurface(from, to) {
  return R.pipe(
    R.partialRight(Vector.ScalarMultiply, [from.size]),
    R.partial(Vector.Add, [from.position]),
    (v) => v.join(' ')
  )(from.DirectionTo(to))
}

function ParseSkillsData(skills_data) {
  let skills = new Set()
  let links = new Set()
  for (const entry of skills_data) {
    skills.add(entry.skill)
    for (const relative of entry.related) {
      skills.add(relative)
      links.add({
        source: entry.skill,
        target: relative
      })
    }
  }

  let skillNodes = new Map()
  skills.forEach((skill) => {
    let newNode = new GraphNode(skill, [])
    skillNodes.set(skill, newNode)
  })
  for (const link of links) {
    skillNodes.get(link.source).links.push(skillNodes.get(link.target))
    skillNodes.get(link.target).links.push(skillNodes.get(link.source))
  }

  return Array.from(skillNodes.values())
}

function main() {
  GetAvailableCameras()
    .then((availableCameras) => {
      let cameraSelect = document.getElementById('camera-select')
      cameraSelect.onchange = HandleCameraSelectOnChange
      for (let i = 0; i < availableCameras.length; i++) {
        let option = document.createElement('option')
        option.value = availableCameras[i].deviceId
        const label = availableCameras[i].label || `Camera ${i}`
        const textNode = document.createTextNode(label)
        option.appendChild(textNode)
        cameraSelect.appendChild(option)
      }
    })
    .catch((error) =>
      console.error('Unable to generate camera selector options')
    )

  fetch('skills-data.json')
    .then((resp) => {
      return resp.json()
    })
    .then(ParseSkillsData)
    .then((skillNodes) => {
      new EadesSpringEmbedderGraphLayout(0.25, 0.25, 0.1).Layout(skillNodes)
      console.log(skillNodes.map((node) => node.position))
      const marker = document.getElementsByTagName('a-marker')[0]
      let lines = document.createElement('a-entity')
      marker.appendChild(lines)
      let uniqueLinks = new Set()
      for (const node of skillNodes) {
        CreateChildTextSphere(marker, node.position, node.size, node.data)
        for (const link of node.links) {
          let linkSpec = [node.data, link.data]
          const linkHasNotBeenDrawn = !(
            uniqueLinks.has(linkSpec) || uniqueLinks.has(linkSpec.reverse())
          )
          if (linkHasNotBeenDrawn) {
            lines.setAttribute(`line__${uniqueLinks.size}`, {
              start: GetColinearPointOnSurface(node, link),
              end: GetColinearPointOnSurface(link, node),
              color: 'black'
            })
            uniqueLinks.add(linkSpec)
          }
        }
      }
    })
}

window.onload = main
