/**
Author: George Perry
Date: 05/02/18
**/

//show an error message to user if their device/browser doesn't support webgl.
if (!Detector.webgl) {
    var errorMessage = Detector.getWebGLErrorMessage();
    document.getElementById('main').appendChild(errorMessage);
}

var scene = new THREE.Scene;
var renderer, camera;

var controls;
var bottom = false;
var activeGroup;
var level1Name = "";
var level2Name = "";
var active;

//variables from the link text
var textGeo;
var font;
var textMesh1;
var textHeight = 2;
var textSize;

//variables for link background circles
var circleGeometry = new THREE.CircleGeometry(150, 100);
var circleGeometryOuter = new THREE.CircleGeometry(158, 100);

//Grouped objects
var aboutGroup = new THREE.Group();
aboutGroup.name = "ABOUT";

var workGroup = new THREE.Group();
workGroup.name = "WORK";

var peopleGroup = new THREE.Group();
peopleGroup.name = "PEOPLE";

var careersGroup = new THREE.Group();
aboutGroup.name = "CAREERS";

var viewsGroup = new THREE.Group();
viewsGroup.name = "VIEWS";

var contactGroup = new THREE.Group();
contactGroup.name = "CONTACT";

var level1 = false;
var level2 = false;
var level3 = false;

//variables for registering when a link has been clicked.
var objects = [];
var name;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

//transitions forward and backward
var controlsEnabled = true;

var moveForward = false;
var moveBackward = false;
var moveForwardButton = false;
var moveBackwardButton = false;

var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var directionButton = new THREE.Vector3();


function init() {

    loadFont();

    //adding fog to the scene
    scene.fog = new THREE.FogExp2("#ABEAFF", 0.0004);

    //creating scene plane
    var plane = getPlane(20000);
    plane.position.set(0, -1000, -4000);
    plane.rotation.x = Math.PI/1.9;

    scene.add(plane);

    //creating the scene's camera
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        1,
        5000
    );

    camera.position.set(0, 1000, 2000);

    camera.lookAt(new THREE.Vector3(0, 0, 0));

    transition();

    systemLocation();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor("#FFFFFF");
    scene.background = new THREE.Color("#ABEAFF");
    document.getElementById('main').appendChild(renderer.domElement);

    getClickObject();

    animate(renderer, scene, camera);

    window.addEventListener('resize', onWindowResize, false);
}

function getLight(intensity) {
    var light = new THREE.AmbientLight("#FFFFFF", intensity);
    return light;
}

//Plane for background
function getPlane(size) {
	var geometry = new THREE.PlaneGeometry(size, size);
	var material = new THREE.MeshBasicMaterial({
		color: "#00C0FF",
		side: THREE.DoubleSide
	});
	var mesh = new THREE.Mesh(
		geometry,
		material
	);

	return mesh;
}

// Adds relevant text to left hand side so user can navigation through system.
function systemLocation() {
    if (level1Name && !activeGroup.bottom) {
        level1Ctx.font = "20px Arial";
        level1Ctx.strokeText(level1Name, 10, 35);
        locationLevel1.onclick = function() {goLevel1()};
    }

    if (level2Name) {
        level2Ctx.font = "20px Arial";
        level2Ctx.strokeText(level2Name, 10, 35);
    }
}

//Moves camera back to layer 0.
function goHome() {
    if (controls.getObject().position.z < -3000) {
        activeGroup.parent.position.y -= 25;
        activeGroup.parent.position.z += -100;
        while (controls.getObject().position.z < -3400) {
            moveBackward = true;
            transitionLoop();
            moveBackward = false;
        }
    } else {
        activeGroup.children[0].position.y -= 25;
        activeGroup.children[0].position.z += -100;
        while (controls.getObject().position.z < -2000) {
            moveBackward = true;
            transitionLoop();
            moveBackward = false;
        }
    }
    homeCtx.active = true;
    homeCtx.clearRect(0, 0, home.width, home.height);
    locationGradient(homeCtx, home);
    homeCtx.strokeText("HOME", 10, 35);
    level1Ctx.clearRect(0, 0, locationLevel1.width, locationLevel1.height);
    level2Ctx.clearRect(0, 0, locationLevel2.width, locationLevel2.height);
    locationLevel1.style.display = "none";
    locationLevel2.style.display = "none";
    hideAllChildren();
}

//Moves camera to correct oldPosition
//Removes all text on left side and adds back in relevant text.
function goLevel1() {
    while (controls.getObject().position.z < -4680) {
        moveBackward = true;
        transitionLoop();
    }
    level1Ctx.clearRect(0, 0, locationLevel1.width, locationLevel1.height);
    locationGradient(level1Ctx, locationLevel1);
    level1Ctx.strokeText(level1Name, 10, 35);
    homeCtx.visible = false;
    homeCtx.clearRect(0, 0, home.width, home.height);
    homeCtx.strokeText("HOME", 10, 35);
    level2Ctx.clearRect(0, 0, locationLevel2.width, locationLevel2.height);
    locationLevel2.style.display = "none";
    hideLevelChildren();
    moveBackward = false;
}

//Creates the colour gradient that goes behind the active location object
function locationGradient(context, canvas) {
    var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height * 0.8);
    gradient.addColorStop(0, "#ABEAFF");
    gradient.addColorStop(0.5, "#D885ED");
    gradient.addColorStop(1, "#ABEAFF");

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height * 0.8);
}

//create item areas
function areaLength() {
    var itemLength = 1;
    var areaDiameter;
    if (window.innerWidth < window.innerHeight) {
        areaDiameter = (window.innerWidth / itemLength) / 4 * 0.4;
    } else {
        areaDiameter = (window.innerHeight / itemLength) / 4 * 0.7;
    }

    return areaDiameter;
}

//create the basic areas of the link object's circles
function itemArea(group, color1, color2, color3, color4) {

    var canvas = document.createElement("canvas");
    var canvasOuter = document.createElement("canvas");

    setGradient(canvas, canvasOuter, "inner", color1, color2);
    setGradient(canvas, canvasOuter, "outer", color3, color4);

    var shadowTexture = new THREE.Texture(canvas);
    shadowTexture.needsUpdate = true;

    var shadowTextureOuter = new THREE.Texture(canvasOuter);
    shadowTextureOuter.needsUpdate = true;

    var material = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        side: THREE.DoubleSide
    });
    var materialOuter = new THREE.MeshBasicMaterial({
        map: shadowTextureOuter,
        side: THREE.DoubleSide
    });


    var circle = new THREE.Mesh(circleGeometry, material);
    var circleOuter = new THREE.Mesh(circleGeometryOuter, materialOuter);

    circleOuter.name = group.name;

    return [circle, circleOuter];
}

//Create colour gradient for link item's circles
function setGradient(canvas, canvasOuter, circle, color1, color2) {
    if (circle == "inner") {
        var circleInner = canvas.getContext('2d');
    } else {
        var circleOuter = canvasOuter.getContext('2d');
    }

    var x = 150,
        y = 75,
        // Radii of the black glow.
        innerRadius = 0,
        outerRadius = 200,
        // Radius of the entire circle.
        radius = 200;

    if (circle == "inner") {
        var gradient = circleInner.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
    } else {
        var gradient = circleOuter.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
    }

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    if (circle == "inner") {
        circleInner.arc(x, y, radius, 0, 2 * Math.PI);

        circleInner.fillStyle = gradient;
        circleInner.fill();

        return circleInner;
    } else {
        circleOuter.arc(x, y, radius, 0, 2 * Math.PI);

        circleOuter.fillStyle = gradient;
        circleOuter.fill();

        return circleOuter;
    }

}

//load font from fonts folder to use for link text
function loadFont() {

    var loader = new THREE.FontLoader();
    loader.load('../fonts/work_sans_regular.json', function (response) {

        font = response;

        refreshText();
    });
}

//Creation of text using in the links
function createTextModel(x, y, z, words, group, color, fontSize) {
    if (fontSize == null) fontSize = 32;
    textGeo = new THREE.TextGeometry(words, {
        font: font,
        size: fontSize,
        height: textHeight
    });
    var materials = [
        new THREE.MeshBasicMaterial({
            color: color,
            flatShading: true
        })
    ];

    textMesh = new THREE.Mesh(textGeo, materials);

    textMesh.position.set(x, y, z);

    textMesh.rotation.x = 0;

    group.add(textMesh);

}

//Create the two circles for the link and merge then into one group.
function createItemModel(a, b, c, text, textColor, group, parentGroup, color1, color2, color3, color4, x, y, z) {
    if (a == null && b == null && c == null) {
        a = -90;
        b = 18;
        c = 0;
    }
    createTextModel(a, b, 0, text, group, textColor);

    var areaName = itemArea(group, color1, color2, color3, color4);
    var inner = areaName[0];
    var outer = areaName[1];

    group.position.set(x, y, z);
    group.add(outer);
    group.add(inner);

    if (parentGroup) {
        objects.push(parentGroup);
    } else {
        objects.push(outer);
    }

    outer.position.set(0, 0, -0.2);

    return group;

}

//Create all of the links in the system
function refreshText() {

    //Creation of link groups for ABOUT
    var aboutGroupLevel1 = new THREE.Group();
    aboutGroupLevel1.name = "aboutGroupLevel1";
    aboutGroupLevel1.level1 = true;
    aboutGroupLevel1.bottom = true;

    aboutGroup.add(aboutGroupLevel1);

    createItemModel(-70, -5, null, "ABOUT", "#2b00f7", aboutGroupLevel1, null, "#FF00FF", "#FFFF00", "#FFFFFF", "#6600FF", -800, 650, 480);


    //WORK
    var workGroupLevel1 = new THREE.Group();
    workGroupLevel1.name = "work level 1";
    workGroupLevel1.bottom = true;
    workGroupLevel1.level1 = true;

    workGroup.add(workGroupLevel1);

    createItemModel(-70, -10, null, "WORK", "#2b00f7", workGroupLevel1, null, "#FF00FF", "#FFFF00", "#FFFFFF", "#6600FF", -250, 625, 510);


    //PEOPLE
    var peopleGroupLevel1 = new THREE.Group();
    peopleGroupLevel1.name = "people level 1";
    peopleGroupLevel1.level1 = true;
    peopleGroupLevel1.bottom = true;

    peopleGroup.add(peopleGroupLevel1);

    createItemModel(-80, -5, null, "PEOPLE", "#2b00f7", peopleGroupLevel1, null, "#FF00FF", "#FFFF00", "#FFFFFF", "#6600FF", 400, 600, 520);


    //CAREERS
    var careersGroupLevel1 = new THREE.Group();
    careersGroupLevel1.name = "careers level 1";
    careersGroupLevel1.level1 = true;
    careersGroupLevel1.bottom = true;

    careersGroup.add(careersGroupLevel1);

    createItemModel(-90, -5, null, "CAREERS", "#2b00f7", careersGroupLevel1, null, "#FF00FF", "#FFFF00", "#FFFFFF", "#6600FF", -550, 350, 700);

    //VIEWS
    var viewsGroupLevel1 = new THREE.Group();
    viewsGroupLevel1.name = "views level 1";
    viewsGroupLevel1.level1 = true;
    viewsGroupLevel1.bottom = true;

    viewsGroup.add(viewsGroupLevel1);

    createItemModel(-60, -10, null, "VIEWS", "#2b00f7", viewsGroupLevel1, null, "#FF00FF", "#FFFF00", "#FFFFFF", "#6600FF", -150, 270, 700);

    //CONTACT
    var contactGroupLevel1 = new THREE.Group();
    contactGroupLevel1.name = "contact level 1";
    contactGroupLevel1.level1 = true;
    contactGroupLevel1.bottom = true;

    contactGroup.add(contactGroupLevel1);

    createItemModel(-100, -5, null, "CONTACT", "#2b00f7", contactGroupLevel1, null, "#FF00FF", "#FFFF00", "#FFFFFF", "#6600FF", 470, 280, 700);


    scene.add(aboutGroup);
    scene.add(workGroup);
    scene.add(peopleGroup);
    scene.add(careersGroup);
    scene.add(viewsGroup);
    scene.add(contactGroup);
}

//Creates event listeners to listen for clicks
//Calls relevant functions on clicking of the screen.
function getClickObject() {

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);

	document.getElementById('main').appendChild(renderer.domElement);
}

function onDocumentTouchStart(event) {
	event.preventDefault();
	event.clientX = event.touches[0].clientX;
	event.clientY = event.touches[0].clientY;
	onDocumentMouseDown(event);
}

//Checks if mouse click is over a link
//Modify text on left side depending on which layer clicked on
function onDocumentMouseDown(event) {
	event.preventDefault();
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);

	var intersects = raycaster.intersectObjects(objects);
	if (intersects.length > 0) {
        var activeItem = intersects[0].object.parent;

        if (activeItem.level1 && activeItem.parent.name && !activeItem.bottom) {
            level1Name = "";
            level1Name = activeItem.parent.name;
            level1Ctx.clearRect(0, 0, locationLevel1.width, locationLevel1.height);
            locationGradient(level1Ctx, locationLevel1);
            level1Ctx.strokeText(level1Name, 10, 35);
            homeCtx.active = false;
            homeCtx.clearRect(0, 0, home.width, home.height);
            homeCtx.strokeText("HOME", 10, 35);
            level2Ctx.clearRect(0, 0, locationLevel2.width, locationLevel2.height);
        } else if (activeItem.level2 && activeItem.parent.name) {
            level2Name = activeItem.name;
            level2Ctx.clearRect(0, 0, locationLevel2.width, locationLevel2.height);
            locationGradient(level2Ctx, locationLevel2);
            level2Ctx.strokeText(level2Name, 10, 35);
            level1Ctx.clearRect(0, 0, locationLevel1.width, locationLevel1.height);
            homeCtx.visible = false;
            homeCtx.clearRect(0, 0, home.width, home.height);
            homeCtx.strokeText("HOME", 10, 35);
        }

        showHideChildren(activeItem, true);
	}
}

//Move camera to see new layer
//Show child links of object clicked
function showHideChildren(group, visible) {
    if (group.bottom) {
        return;
    }

    activeGroup = group;

    var length = group.children.length;
    var childLength = 0;

    group.children[0].visible = visible;

    var oldPosition = controls.getObject().position.z;

    if (group.level1) {
        while (controls.getObject().position.z > oldPosition - 2) {
            moveForward = true;
            transitionLoop();
        }

        level1Ctx.clearRect(0, 0, locationLevel1.width, locationLevel1.height);
        locationGradient(level1Ctx, locationLevel1);
        locationLevel1.style.display = "block";

        group.children[0].position.y += 25;
        group.children[0].position.z += 100;
        var length = group.children[0].children.length;
        for (var i = 1; i < length; i ++) {
            var lnth = group.children[0].children[i].children.length;
            for (var j = 3; j < lnth; j++) {
                group.children[0].children[i].children[j].visible = false;
            }
        }
        moveForward = false;

    } else if (group.level2) {

        while (controls.getObject().position.z > oldPosition - 2) {
            moveForward = true;
            transitionLoop();
        }
        level2Ctx.clearRect(0, 0, locationLevel2.width, locationLevel2.height);
        locationGradient(level2Ctx, locationLevel2);
        locationLevel2.style.display = "block";
        var length = group.children.length;
        for (var i = 1; i < length; i ++) {
            group.children[i].visible = true;
        }

        moveForward = false;
    } else if (group.level3) {

    }

    systemLocation();

}

//Hide all children in the scene below the top layer.
function hideAllChildren() {
    for (var i = 2; i < scene.children.length; i++) {
        if (scene.children[i].children.length > 0) {
            activeGroup.children[0].visible = false;
        }
    }
}
//Hide the child elements on the current layer
function hideLevelChildren() {
    if (activeGroup) {
        for (var i = 3; i < activeGroup.children.length; i++) {
            activeGroup.children[i].visible = false;
        }
    }
}
//Show the children of the object clicked on
function showLevelChildren() {
    if (activeGroup) {
        for (var i = 3; i < activeGroup.children.length; i++) {
            activeGroup.children[i].visible = true;
        }
    }
}

// User can use W and S keys to move through system.
function transition() {

    controls = new THREE.PointerLockControls(camera);
    controls.enabled = true;
    controls.getObject().position.y = 1000;
    scene.add(controls.getObject());

    var onKeyDown = function (event) {

        switch (event.keyCode) {
            case 87: // w
                moveForwardButton = true;
                break;
            case 83: // s
                moveBackwardButton = true;
                break;
        }
    };

    var onKeyUp = function (event) {

        switch(event.keyCode) {

            case 87: // w
                moveForwardButton = false;
                break;
            case 83: // s
                moveBackwardButton = false;
                break;


        }

    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

//Move forward and backward through the scene.
function transitionLoop() {

    if (controlsEnabled === true) {

        var time = performance.now();

        velocity.z -= velocity.z * 0.16;

        velocity.y -= 1.568;

        direction.z = Number(moveForward) - Number(moveBackward);
        directionButton.z = Number(moveForwardButton) - Number(moveBackwardButton);

         if (moveForward) velocity.z -= direction.z * 400;
         if (moveBackward) velocity.z -= direction.z * 200;
         if (moveForwardButton || moveBackwardButton) velocity.z -= directionButton.z * 20;

        controls.getObject().translateZ(velocity.z * 1);
        controls.getObject().position.y = 0;


        if (controls.getObject().position.y < 10) {

            velocity.y = 0;
            controls.getObject().position.y = 10;

        }

    }
}

//Change position of items when size of window changes
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
    renderer.render(
        scene,
        camera
    );
}

//Continuously render scene
//Rotate objects
function animate(renderer, scene, camera) {
    render();

    requestAnimationFrame(function() {
        animate(renderer, scene, camera);
    });

    if (aboutGroup.rotation.z < 0.08) aboutGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (aboutGroup.rotation.z < 0.81 && aboutGroup.rotation.z > -0.8) aboutGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    aboutGroup.rotation.y += 0.0003;

    if (workGroup.rotation.z < 0.08) workGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (workGroup.rotation.z < 0.81 && workGroup.rotation.z > -0.8) workGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    workGroup.rotation.y += 0.0003;

    if (peopleGroup.rotation.z < 0.08) peopleGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (peopleGroup.rotation.z < 0.81 && peopleGroup.rotation.z > -0.8) peopleGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    peopleGroup.rotation.y += 0.0003;

    if (careersGroup.rotation.z < 0.08) careersGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (careersGroup.rotation.z < 0.81 && careersGroup.rotation.z > -0.8) careersGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    careersGroup.rotation.y += 0.0003;

    if (viewsGroup.rotation.z < 0.08) viewsGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (viewsGroup.rotation.z < 0.81 && viewsGroup.rotation.z > -0.8) viewsGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    viewsGroup.rotation.y += 0.0003;

    if (contactGroup.rotation.z < 0.08) contactGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (contactGroup.rotation.z < 0.81 && contactGroup.rotation.z > -0.8) contactGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    contactGroup.rotation.y += 0.0003;

    transitionLoop();
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

init();
