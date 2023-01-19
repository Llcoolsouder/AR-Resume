/**
 * AR.js Sandbox App
 */

import { GraphNode, EadesSpringEmbedderGraphLayout } from './graph-layout.js'

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
 * @param {string} text Label to display inside the object
 */
function CreateChildTextSphere(parent, position, text) {
  let sphere = document.createElement('a-entity')
  sphere.setAttribute('geometry', { primitive: 'sphere' })
  sphere.setAttribute('material', { color: '#b3b3cc', opacity: 0.5 })
  sphere.object3D.position.set(...position)
  sphere.object3D.scale.set(0.25, 0.25, 0.25)
  parent.appendChild(sphere)

  let sphereText = document.createElement('a-entity')
  sphereText.setAttribute('text', {
    value: text,
    align: 'center'
  })
  sphereText.object3D.scale.set(8, 8, 8)
  sphere.appendChild(sphereText)
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
      console.erro('Unable to generate camera selector options')
    )

  fetch('skills-data.json')
    .then((resp) => {
      return resp.json()
    })
    .then(ParseSkillsData)
    .then((skillNodes) => {
      new EadesSpringEmbedderGraphLayout(0.5, 0.5, 0.25).Layout(skillNodes)
      console.log(skillNodes.map((node) => node.position))
      const marker = document.getElementsByTagName('a-marker')[0]
      for (const node of skillNodes) {
        CreateChildTextSphere(marker, node.position, node.data)
      }
    })
}

window.onload = main
