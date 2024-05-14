import * as THREE from 'three';
import * as TWEEN from "@tweenjs/tween.js";
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

//------------
//FRONTEND
//------------

let camera, scene, renderer, cssrenderer;
let root, background;
let endCameraPosition = new THREE.Vector3(0, 1.5, 4);
let projectOpen = false;
let divRotation = 0;

init();
animate();

function init() {
    // SCENE, CAMERA
    scene = new THREE.Scene();
    scene.background = new THREE.Color('lightGray');
    camera = new THREE.PerspectiveCamera(50, 64 / 48, 0.1, 100);
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    // GRID HELPERS
    const size = 16;
    const divisions = 32;
    const colorGrid = new THREE.Color('gray');
    const centerGrid = new THREE.Color('blue');
    scene.add(new THREE.GridHelper(size, divisions, centerGrid, colorGrid));

    // AXIS HELPER
    scene.add(new THREE.AxesHelper(20));

    //CSS3D HOME ELEMENT
    root = new THREE.Object3D()
    root.position.y = 20;
    scene.add(root)

    background = makeElementObject('div', 200, 200, 'url("textures/Icon.png")', '')
    background.position.y = -19.5;
    background.scale.set(.01, .01, .01);
    root.add(background);

    // RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    $('#canvasWebgl').append(renderer.domElement);

    //CSS3D RENDERER
    cssrenderer = new CSS3DRenderer();
    cssrenderer.setSize(window.innerWidth, window.innerHeight);
    $('#canvasCss').append(cssrenderer.domElement);

    // RESIZE EVENT
    window.addEventListener('resize', onWindowResize);

    //START CAMERA ANIMATION
    initialCameraAnimation();

    //OPEN THE MENUS
    setTimeout(() => { openMenu() }, 3000);
}

function animate(time) {

    requestAnimationFrame(animate);

    root.rotation.y += 0.01;
    TWEEN.update(time);

    renderer.render(scene, camera);
    cssrenderer.render(scene, camera);
}

function initialCameraAnimation() {
    new TWEEN.Tween(camera.position)
        .to({
            x: endCameraPosition.x,
            y: endCameraPosition.y,
            z: endCameraPosition.z
        }, 3000)
        .interpolation(TWEEN.Interpolation.CatmullRom)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();

    new TWEEN.Tween(camera.rotation)
        .to({
            x: camera.rotation.x + .5,
            y: camera.rotation.y,
            z: camera.rotation.z
        }, 3000)
        .interpolation(TWEEN.Interpolation.CatmullRom)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function openMenu() {
    $('#menuLeft').css({ left: 0 });
    $('#menuRight').css({ right: 0 });
}

function makeElementObject(type, width, height, background, backgroundColor) {
    const obj = new THREE.Object3D

    const element = document.createElement(type);

    element.style.width = width + 'px';
    element.style.height = height + 'px';
    element.style.backgroundColor = backgroundColor;
    element.style.backgroundRepeat = 'no-repeat';
    element.style.backgroundImage = background;
    element.style.backgroundSize = 'contain';
    element.style.backgroundPosition = 'center';

    var css3dObject = new CSS3DObject(element);
    obj.css3dObject = css3dObject
    obj.add(css3dObject)

    return obj
}

//PROJECTS INTERACTIONS

$('#menuLeft').on("mouseover", '.projectLink', function () {
    var id = $(this).attr('id');
    let index;
    for (let i = 0; i < Projects.length; i++) {
        if (Projects[i].id == id) {
            index = i;
            break
        }
    }
    const project = Projects[index];
    background.css3dObject.element.style.backgroundImage = 'url("' + project.image + '")';
});

$('#menuLeft').on("mouseleave", '.projectLink', function () {
    background.css3dObject.element.style.backgroundImage = 'url("textures/Icon.png")';
});

$('#menuLeft').on("click", '.projectLink', function () {
    //Get correct Project
    var id = $(this).attr('id');
    let index;
    for (let i = 0; i < Projects.length; i++) {
        if (Projects[i].id == id) {
            index = i;
            break
        }
    }
    const project = Projects[index];

    if (!projectOpen) {
        projectOpen = true;
        $("#project").css({ "top": '10%' });
    } else {
        divRotation += 360;
        console.log(divRotation);
        $("#project").css({ "transform": 'translateX(-50%) RotateY(' + divRotation + 'deg)' });
    }

    $("#projectImage").css({ "background-image": 'url(' + project.image + ')' });
    $("#projectName").text(project.name);
    var text = project.text,
        target = document.getElementById('projectText'),
        converter = new showdown.Converter(),
        html = converter.makeHtml(text);
    target.innerHTML = html;
});

$('#project').on("click", '#closeDiv', function () {
    projectOpen = false;
    $("#project").css({ "top": '100%' });
    divRotation += 0;
});

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    cssrenderer.setSize(window.innerWidth, window.innerHeight);
}

//------------
//BACKEND
//------------

const firebaseConfig = {
    apiKey: "AIzaSyAr77JnePBb4c0VZPW4NwD5ex5-D98jJtY",
    authDomain: "leocarlton-e2118.firebaseapp.com",
    projectId: "leocarlton-e2118",
    storageBucket: "leocarlton-e2118.appspot.com",
    messagingSenderId: "944118388874",
    appId: "1:944118388874:web:f61c25a6673321ec33b573"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

let Projects = [];

class Project {
    constructor(name, image, text, type, id) {
        this.name = name;
        this.image = image;
        this.text = text;
        this.type = type;
        this.id = id;
    }
}

//Add texts
const querySnapshotAbout = await getDocs(collection(db, "texts"));
await querySnapshotAbout.forEach((doc) => {
    var text = doc.data().about_text,
        target = document.getElementById('aboutText'),
        converter = new showdown.Converter(),
        html = converter.makeHtml(text);
    target.innerHTML = html;
});

//Create Projects
const querySnapshot = await getDocs(collection(db, "projects"));
await querySnapshot.forEach((doc) => {
    const name = doc.data().project_name;
    const header_image = doc.data().cover_image;
    const type = doc.data().types;
    const text = doc.data().text;

    const project = '<p class="projectLink" id=' + Projects.length + '> ' + name + '</p>';
    Projects.push(new Project(name, header_image, text, type, Projects.length));
    $('#' + type.slice(1)).append(project);
});
