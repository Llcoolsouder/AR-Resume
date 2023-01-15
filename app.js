/**
 * AR.js Sandbox App
 */

async function GetAvailableCameras() {
    const IsBackCamera = device => device.kind == "videoinput" && device.label.includes("facing back")
    return navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(IsBackCamera));
}

function CameraSelectOnChange() {
    let cameraSelect = document.getElementById("camera-select");
    let video = document.getElementById("arjs-video");
    if (typeof video.srcObject !== "undefined") {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
    let constraints = {
        video: {deviceId: { exact: cameraSelect.value }},
        audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => video.srcObject = stream)
        .catch(error => console.log(error));
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
}


window.onload = main;
