import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'
import { getFirestore, collection, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { CSS3DRenderer, CSS3DObject } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/renderers/CSS3DRenderer.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

//------------
//FRONTEND
//------------

let camera, scene, renderer, cssrenderer, background, root, mobile, gizmo;
let endCameraPosition = new THREE.Vector3(0, 1.5, 4);
let projectOpen, active = false;
let divRotation, overlayRotation = 0;
let drag = false;
var originX, endX, resizeElement;

init();
animate();
onWindowResize();

function init() {
    //UTIL

    mobile = mobileCheck();

    // SCENE, CAMERA
    scene = new THREE.Scene();
    scene.background = new THREE.Color('lightGray');
    camera = new THREE.PerspectiveCamera(50, 64 / 48, 0.1, 100);
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    // GRID HELPERS
    let size;
    if (mobile) {
        size = 8;
    } else {
        size = 16;
    }
    const divisions = 32;
    const colorGrid = new THREE.Color('gray');
    const centerGrid = new THREE.Color('blue');
    scene.add(new THREE.GridHelper(size, divisions, centerGrid, colorGrid));

    // AXIS HELPER
    scene.add(new THREE.AxesHelper(20));

    //CSS3D HOME ELEMENT
    root = new THREE.Object3D()
    root.position.y = 20;
    scene.add(root);

    background = makeElementObject('div', 200, 200, 'url("")', '')
    background.position.y = -19.5;
    background.scale.set(.008, .008, .008);
    root.add(background);

    //Circle Gizmo
    const loader = new GLTFLoader();
    loader.load(
        // resource URL
        './textures/gizmo.gltf',
        // called when the resource is loaded
        function (gltf) {
            gizmo = gltf.scene;
            gizmo.rotation.y = Math.PI / 2;
            gizmo.scale.set(.55, .75, .55);
            gizmo.position.y = .5;
            scene.add(gizmo);
        }
    );

    //Add a light
    const light = new THREE.AmbientLight(0x404040, 5); // soft white light
    scene.add(light);

    // RENDERER
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.zIndex = '1';
    $('#canvasWebgl').append(renderer.domElement);

    //CSS3D RENDERER
    cssrenderer = new CSS3DRenderer({ alpha: true });
    cssrenderer.setSize(window.innerWidth, window.innerHeight);
    $('#canvasCss').append(cssrenderer.domElement);

    // RESIZE EVENT
    window.addEventListener('resize', onWindowResize);

    //START CAMERA ANIMATION
    initialCameraAnimation();

    //OPEN THE MENUS
    if (!mobile) {
        setTimeout(() => { openMenu() }, 3000);
    } else {
        setTimeout(() => { openTabs() }, 3000);
    }
}

function animate(time) {

    requestAnimationFrame(animate);

    root.rotation.y += 0.01;
    if (gizmo) {
        gizmo.rotation.y += 0.01;
    }

    overlayRotation += 1;
    $("#overlayCanvas").css({ "transform": 'RotateY(' + overlayRotation + 'deg)' });

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
    $('#menuContainerLeft').css({ left: 0 });
    $('#menuContainerRight').css({ right: 0 });
}

function openTabs() {
    $('#menuContainerLeft').css({ left: '-100%' });
    $('#menuContainerRight').css({ right: '-100%' });
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
    background.css3dObject.element.style.backgroundImage = 'url("")';
});

$('#menuLeft').on("click", '.projectLink', function () {
    //Get correct Project
    var id = $(this).attr('id');
    let index;
    if (mobile) {
        triggerTabs();
    }
    for (let i = 0; i < Projects.length; i++) {
        if (Projects[i].id == id) {
            index = i;
            break
        }
    }
    const project = Projects[index];

    if (!projectOpen) {
        projectOpen = true;
        $("#project").css({ "transition": '0s' });
        $("#project").css({ 'top': '100%' });
        setTimeout(() => {
            $("#project").css({ "transition": '1s' });
            if (mobile) {
                $("#project").css({ 'top': '0' });
            } else {
                $("#project").css({ 'top': '10%' });
            }
        }, 100);
    } else {
        divRotation += 360;
        $("#project").css({ "transform": 'translateX(-50%) RotateY(' + divRotation + 'deg)' });
    }

    $("#overlayCanvas").css({ "background-image": 'url("' + project.image + '")' });
    $("#projectName").text(project.name);
    var text = project.text,
        target = document.getElementById('projectText'),
        converter = new showdown.Converter(),
        html = converter.makeHtml(text);
    target.innerHTML = html;

    $('#projectText img').each(function () {
        $(this).after("<p class='imageDesc'>" + $(this).attr("alt") + "</p>");
    });
});

$('#project').on("click", '#closeDiv', function () {
    projectOpen = false;
    $("#project").css({ "top": '-100%' });
    divRotation += 0;
});

$('.tabs').on("click", function () {
    triggerTabs(this);
});

function triggerTabs(child) {
    if (active) {
        $('#menuContainerRight').css({ 'right': '-100%', 'width': '110%' });
        $('#menuContainerLeft').css({ 'left': '-100%', 'width': '110%' });
        active = false;
    } else {
        if ($(child).parent().attr('id') == 'menuContainerRight') {
            $(child).parent().css({ 'right': '0', 'width': '100%' });
            $('#menuContainerLeft').css('left', '-110%');
            active = true;
        } else {
            $(child).parent().css({ 'left': '0', 'width': '100%' });
            $('#menuContainerRight').css('right', '-110%');
            active = true;
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    cssrenderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
}

//Resize Containers

$('.resize').on("mousedown", function (e) {
    if (!drag) {
        drag = true;
        originX = e.pageX;
        resizeElement = $(this).parent();
    }
});

$(document).on("mousemove", function (e) {
    endX = e.pageX - originX;
    if (resizeElement && resizeElement.attr("id") == 'menuContainerRight') {
        endX = -endX;
    }
    if (drag && resizeElement.width() > 200) {
        resizeElement.width(resizeElement.width() + endX);
        e.preventDefault();
    } else if (resizeElement && resizeElement.width() <= 200) {
        resizeElement.width(201);
    }
});

$(document).on("mouseup", function (e) {
    drag = false;
});

//Check if Mobile
function mobileCheck() {
    let check = false;
    (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
};

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
    constructor(name, image, text, type, id, html) {
        this.name = name;
        this.image = image;
        this.text = text;
        this.type = type;
        this.id = id;
        this.html = html;
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

    text = doc.data().about_contacts,
        target = document.getElementById('aboutCredits'),
        converter = new showdown.Converter(),
        html = converter.makeHtml(text);
    target.innerHTML = html;
});

//Create Projects
const querySnapshot = await getDocs(collection(db, "projects"), orderBy("created_on", "desc"));
await querySnapshot.forEach((doc) => {
    const name = doc.data().project_name;
    const header_image = doc.data().cover_image;
    const type = doc.data().type;
    const text = doc.data().text;

    const project = '<p class="projectLink" id=' + Projects.length + '> ' + name + '</p>';
    Projects.push(new Project(name, header_image, text, type, Projects.length, project));
    //$('#' + type.slice(1)).append(project);
});

Projects.sort((a, b) => b.createdOn - a.createdOn);

for (let i = 0; i < Projects.length; i++) {
    $('#' + Projects[i].type.slice(2)).append(Projects[i].html);
}