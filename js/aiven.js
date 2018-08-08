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
var home = document.getElementById("locationHome");
var homeCtx = home.getContext("2d");
homeCtx.active = true;
var locationLevel1 = document.getElementById("locationLevel1");
var level1Ctx = locationLevel1.getContext("2d");
var locationLevel2 = document.getElementById("locationLevel2");
var level2Ctx = locationLevel2.getContext("2d");
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
var servicesGroup = new THREE.Group();
servicesGroup.name = "SERVICES";

var servicesGroupLevel1 = new THREE.Group();

var caseStudiesGroup = new THREE.Group();
caseStudiesGroup.name = "CASE STUDIES";

var resourcesGroup = new THREE.Group();
resourcesGroup.name = "RESOURCES";

var resourcesGroupLevel1 = new THREE.Group();

var aboutGroup = new THREE.Group();
aboutGroup.name = "ABOUT";

var blogGroup = new THREE.Group();
blogGroup.name = "BLOG";

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
    renderer.setClearColor("#ffffff");
    scene.background = new THREE.Color("#ABEAFF");
    document.getElementById('main').appendChild(renderer.domElement);

    getClickObject();

    animate(renderer, scene, camera);

    window.addEventListener('resize', onWindowResize, false);
}

function getLight(intensity) {
    var light = new THREE.AmbientLight("#ffffff", intensity);
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

    homeCtx.font = "20px Arial";
    if (homeCtx.active) locationGradient(homeCtx, home);
    homeCtx.strokeText("HOME", 10, 35);
    home.onclick = function() {goHome()};
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
    } );
}

//Creation of text using in the links
function createTextModel(x, y, z, words, group, color, fontSize) {
    if (fontSize == null) fontSize = 25;
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

    //Creation of link groups
    servicesGroupLevel1.name = "servicesGroupLevel1";
    servicesGroupLevel1.level1 = true;
    var servicesGroupLevel2 = new THREE.Group();
    servicesGroupLevel2.name = "Services Group Level2";
    servicesGroupLevel2.level2 = true;
    servicesGroupLevel2.bottom = true;
    servicesGroupLevel2.rotation.x = Math.PI / 70;

    servicesGroupLevel1.add(servicesGroupLevel2);
    servicesGroup.add(servicesGroupLevel1);

    //Services
    createItemModel(-80, 5, null, "SERVICES", "#FFFFFF", servicesGroupLevel1, null, "#FF6A40", "#F8424F", "#FFFFFF", "#FF6A41", -400, 650, 480);

        //Services -> PostgreSQL
        var servicesPostgresql = new THREE.Group();
        servicesPostgresql.name = "postgresqlGroup";
        servicesPostgresql.bottom = true;
        createItemModel(-110, 5, null, "POSTGRESQL", "#FFFFFF", servicesPostgresql, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", -100, -300, -2800);
        servicesGroupLevel2.visible = false;
        servicesGroupLevel2.add(servicesPostgresql);

        //Services -> Elasticsearch
        var servicesElasticSearch = new THREE.Group();
        servicesElasticSearch.name = "elasticSearchGroup";
        servicesElasticSearch.bottom = true;
        createItemModel(-140, 5, null, "ELASTICSEARCH", "#FFFFFF", servicesElasticSearch, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", 500, -300, -2800);
        servicesGroupLevel2.add(servicesElasticSearch);

        //Services -> Kafka
        var servicesKafka = new THREE.Group();
        servicesKafka.name = "kafkaGroup";
        servicesKafka.bottom = true;
        createItemModel(-70, 10, null, "KAFKA", "#FFFFFF", servicesKafka, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", 1100, -300, -2800);
        servicesGroupLevel2.add(servicesKafka);

        //Services -> Grafana
        var servicesGrafana = new THREE.Group();
        servicesGrafana.name = "Grafana";
        servicesGrafana.bottom = true;
        createItemModel(-85, 12, null, "GRAFANA", "#FFFFFF", servicesGrafana, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", -100, -600, -2600);
        servicesGroupLevel2.add(servicesGrafana);

        //Services -> InfluxDB
        var servicesInfluxDB = new THREE.Group();
        servicesInfluxDB.name = "influxDBGroup";
        servicesInfluxDB.bottom = true;
        createItemModel(-85, 5, null, "INFLUXDB", "#FFFFFF", servicesInfluxDB, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", 500, -600, -2600);
        servicesGroupLevel2.add(servicesInfluxDB);

        //Services -> Redis
        var servicesRedis = new THREE.Group();
        servicesRedis.name = "redisGroup";
        servicesRedis.bottom = true;
        createItemModel(-70, 5, null, "REDIS", "#FFFFFF", servicesRedis, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", 1100, -600, -2600);
        servicesGroupLevel2.add(servicesRedis);


    //Case Studies
    var caseStudiesGroupLevel1 = new THREE.Group();
    caseStudiesGroupLevel1.name = "case studies level 1";
    caseStudiesGroupLevel1.bottom = true;
    caseStudiesGroupLevel1.level1 = true;

    caseStudiesGroup.add(caseStudiesGroupLevel1);

    createItemModel(null, null, null, "CASE\nSTUDIES", "#FFFFFF", caseStudiesGroupLevel1, null, "#FF6A40", "#F8424F", "#ffffff", "#FF6A41", 150, 625, 500);


    //Resources
    resourcesGroupLevel1.name = "resources level 1";
    resourcesGroupLevel1.level1 = true;
    var resourcesGroupLevel2 = new THREE.Group();
    resourcesGroupLevel2.name = "resources level 2";
    resourcesGroupLevel2.level2 = true;
    resourcesGroupLevel2.bottom = true;
    resourcesGroupLevel2.rotation.x = Math.PI / 70;

    resourcesGroupLevel1.add(resourcesGroupLevel2);
    resourcesGroup.add(resourcesGroupLevel1);

    createItemModel(-110, 5, null, "RESOURCES", "#FFFFFF", resourcesGroupLevel1, null, "#FF6A40", "#F8424F", "#ffffff", "#FF6A41", 700, 600, 500);

        //Resources -> API
        var resourcesAPI = new THREE.Group();
        resourcesAPI.name = "API";
        resourcesAPI.bottom = true;
        createItemModel(-30, 0, null, "API", "#FFFFFF", resourcesAPI, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", -1200, -200, -2780);
        resourcesGroupLevel2.visible = false;
        resourcesGroupLevel2.add(resourcesAPI);

        //Resources -> Changelog
        var resourcesChangelog = new THREE.Group();
        resourcesChangelog.name = "Changelog";
        resourcesChangelog.bottom = true;
        createItemModel(-110, 18, null, "CHANGELOG", "#FFFFFF", resourcesChangelog, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", -900, -500, -2580);
        resourcesGroupLevel2.add(resourcesChangelog);

        //Resources -> SLA
        var resourcesSLA = new THREE.Group();
        resourcesSLA.name = "SLA";
        resourcesSLA.bottom = true;
        createItemModel(-30, 0, null, "SLA", "#FFFFFF", resourcesSLA, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", -600, -200, -2780);
        resourcesGroupLevel2.add(resourcesSLA);

        //Resources -> Security & Compliance
        var resourcesSecurity = new THREE.Group();
        resourcesSecurity.name = "Security";
        resourcesSecurity.bottom = true;
        createItemModel(-110, 25, null, "SECURITY &\nCOMPLIANCE", "#FFFFFF", resourcesSecurity, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", -300, -500, -2580);
        resourcesGroupLevel2.add(resourcesSecurity);

        //Resources -> Documentation
        var resourcesDocumentation = new THREE.Group();
        resourcesDocumentation.name = "Documentation";
        resourcesDocumentation.bottom = true;
        createItemModel(-100, 12, null, "DOCUMENT-\nATION", "#FFFFFF", resourcesDocumentation, null, "#FF6A40", "#F8424F", "#FF6A40", "#FF6A41", 0, -200, -2780);
        resourcesGroupLevel2.add(resourcesDocumentation);


    //ABOUT
    var aboutGroupLevel1 = new THREE.Group();
    aboutGroupLevel1.name = "about level 1";
    aboutGroupLevel1.level1 = true;
    aboutGroupLevel1.bottom = true;

    aboutGroup.add(aboutGroupLevel1);

    createItemModel(-50, 0, null, "ABOUT", "#FFFFFF", aboutGroupLevel1, null, "#FF6A40", "#F8424F", "#ffffff", "#FF6A41", -135, 300, 700);

    //BLOG
    var blogGroupLevel1 = new THREE.Group();
    blogGroupLevel1.name = "blog level 1";
    blogGroupLevel1.level1 = true;
    blogGroupLevel1.bottom = true;

    blogGroup.add(blogGroupLevel1);

    createItemModel(-50, 0, null, "BLOG", "#FFFFFF", blogGroupLevel1, null, "#FF6A40", "#F8424F", "#ffffff", "#FF6A41", 425, 300, 700);

    scene.add(servicesGroup);
    scene.add(caseStudiesGroup);
    scene.add(resourcesGroup);
    scene.add(aboutGroup);
    scene.add(blogGroup);
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

    if (servicesGroup.rotation.z < 0.08) servicesGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (servicesGroup.rotation.z < 0.81 && servicesGroup.rotation.z > -0.8) servicesGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    servicesGroup.rotation.y += 0.0002;

    if (servicesGroupLevel1.rotation.z < 0.08) servicesGroupLevel1.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (servicesGroupLevel1.rotation.z < 0.81 && servicesGroupLevel1.rotation.z > -0.8) servicesGroupLevel1.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    servicesGroupLevel1.rotation.y -= 0.0002;

    if (caseStudiesGroup.rotation.z < 0.08) caseStudiesGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (caseStudiesGroup.rotation.z < 0.81 && caseStudiesGroup.rotation.z > -0.8) caseStudiesGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    caseStudiesGroup.rotation.y += 0.0002;

    if (resourcesGroup.rotation.z < 0.08) resourcesGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (resourcesGroup.rotation.z < 0.81 && resourcesGroup.rotation.z > -0.8) resourcesGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    resourcesGroup.rotation.y += 0.0002;

    if (resourcesGroupLevel1.rotation.z < 0.08) resourcesGroupLevel1.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (resourcesGroupLevel1.rotation.z < 0.81 && resourcesGroupLevel1.rotation.z > -0.8) resourcesGroupLevel1.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    resourcesGroupLevel1.rotation.y -= 0.0002;

    if (aboutGroup.rotation.z < 0.08) aboutGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (aboutGroup.rotation.z < 0.81 && aboutGroup.rotation.z > -0.8) aboutGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    aboutGroup.rotation.y += 0.0002;

    if (blogGroup.rotation.z < 0.08) blogGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), 0.01);
    if (blogGroup.rotation.z < 0.81 && blogGroup.rotation.z > -0.8) blogGroup.rotateOnAxis(new THREE.Vector3(0, 0, 0.01), -0.01);

    blogGroup.rotation.y += 0.0002;

    transitionLoop();
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

init();
