/**
 * AR.js Sandbox App
 */

/**
 * Queries back-facing cameras from device
 * @returns Promise containing an array of back-facing, camera, media devices
 */
async function GetAvailableCameras() {
    const IsBackCamera = device => device.kind == "videoinput" && device.label.includes("facing back")
    return navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(IsBackCamera));
}

/**
 * Event handler for Camera Selector OnChange event.
 * This should change the camera to the newly chosen camera
 */
function HandleCameraSelectOnChange() {
    let cameraSelect = document.getElementById("camera-select");
    let video = document.getElementById("arjs-video");
    if (typeof video.srcObject !== "undefined") {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    let constraints = {
        video: { deviceId: { exact: cameraSelect.value } },
        audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => video.srcObject = stream)
        .catch(error => console.log(error));
}


/**
 * Creates an AFrame sphere element with label, `text` parented to `parent` at `position`
 * @param {Element} parent Parent of object to be created
 * @param {Number[]} position 3D Euclidean coordinates of the new object
 * @param {string} text Label to display inside the object
 */
function CreateChildTextSphere(parent, position, text) {
    let sphere = document.createElement("a-entity");
    sphere.setAttribute("geometry", { primitive: "sphere" });
    sphere.setAttribute("material", { color: "#b3b3cc", opacity: 0.5 });
    sphere.object3D.position.set(...position);
    sphere.object3D.scale.set(0.25, 0.25, 0.25);
    parent.appendChild(sphere);

    let sphereText = document.createElement("a-entity");
    sphereText.setAttribute("text", {
        value: text,
        align: "center"
    });
    sphereText.object3D.scale.set(8, 8, 8);
    sphere.appendChild(sphereText);
}


function main() {
    GetAvailableCameras()
        .then(availableCameras => {
            let cameraSelect = document.getElementById("camera-select");
            for (let i = 0; i < availableCameras.length; i++) {
                let option = document.createElement("option");
                option.value = availableCameras[i].deviceId;
                const label = availableCameras[i].label || `Camera ${i}`;
                const textNode = document.createTextNode(label);
                option.appendChild(textNode);
                cameraSelect.appendChild(option);
            }
        })
        .catch(error => console.log("Unable to generate camera selector options"));

    const skills = ['C++', 'CUDA', 'WhateverThisIs'];
    const marker = document.getElementsByTagName("a-marker")[0];
    for (let i = 0; i < skills.length; ++i) {
        const radians = 2 * Math.PI * (i / skills.length);
        const distanceFromCenter = 0.5;
        CreateChildTextSphere(
            marker,
            [Math.cos(radians) * distanceFromCenter, 0, Math.sin(radians) * distanceFromCenter],
            skills[i]);
    }
}


window.onload = main;
