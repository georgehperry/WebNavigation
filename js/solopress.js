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
var bottom = false;
var allProductsGroup = new THREE.Group();
allProductsGroup.name = "ALL PRODUCTS";

var leafletsGroup = new THREE.Group();
leafletsGroup.name = "LEAFLETS & FLYERS";

var businessGroup = new THREE.Group();
businessGroup.name = "BUSINESS CARDS";

var brochuresGroup = new THREE.Group();
brochuresGroup.name = "BROCHURES";

var bannersGroup = new THREE.Group();
bannersGroup.name = "ROLLER BANNERS";

var postersGroup = new THREE.Group();
postersGroup.name = "POSTERS";

var designsGroup = new THREE.Group();
designsGroup.name = "FREE ONLINE\nDESIGNS";

var level1 = false;
var level2 = false;
var level3 = false;

//variables for registering when a link has been clicked.
var objects = [];
var name;
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

_eye = new THREE.Vector3();

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

    if (level1Name) {
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
    });
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
    var allProductsGroupLevel1 = new THREE.Group();
    allProductsGroupLevel1.name = "allProductsGroupLevel1";
    allProductsGroupLevel1.level1 = true;
    var allProductsGroupLevel2 = new THREE.Group();
    allProductsGroupLevel2.name = "all Products Group Level2";
    allProductsGroupLevel2.level2 = true;
    allProductsGroupLevel2.bottom = true;
    allProductsGroupLevel2.rotation.x = Math.PI / 70;

    allProductsGroupLevel1.add(allProductsGroupLevel2);
    allProductsGroup.add(allProductsGroupLevel1);

    //All Products
    createItemModel(null, null, null, "VIEW ALL\nPRODUCTS", "#0a70d6", allProductsGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -250, 750, 700);


    //All Products children

    //1All Products -> A-Boards
    var allProductsAboards = new THREE.Group();
    allProductsAboards.name = "aBoardsGroup";
    allProductsAboards.bottom = true;
    createItemModel(null, null, null, "A-BOARDS", "#0a70d6", allProductsAboards, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -200, -300, -2730);
    allProductsGroupLevel2.visible = false;
    allProductsGroupLevel2.add(allProductsAboards);

    //2All Products -> Appointment Cards
    var allProductsAppointment = new THREE.Group();
    allProductsAppointment.name = "appointmentGroup";
    allProductsAppointment.bottom = true;
    createItemModel(-110, 20, null, "APPOINTMENT\nCARDS", "#0a70d6", allProductsAppointment, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 150, -375, -2730);
    allProductsGroupLevel2.add(allProductsAppointment);

    //3All Products -> Beer Mats
    var allProductsBeerMats = new THREE.Group();
    allProductsBeerMats.name = "beerMatsGroup";
    allProductsBeerMats.bottom = true;
    createItemModel(null, null, null, "BEER MATS", "#0a70d6", allProductsBeerMats, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 500, -300, -2730);
    allProductsGroupLevel2.add(allProductsBeerMats);

    //4All Products -> Bookmarks
    var allProductsBookmarks = new THREE.Group();
    allProductsBookmarks.name = "bookmarksGroup";
    allProductsBookmarks.bottom = true;
    createItemModel(-100, null, null, "BOOKMARKS", "#0a70d6", allProductsBookmarks, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 850, -375, -2730);
    allProductsGroupLevel2.add(allProductsBookmarks);

    //5All Products -> Brochures
    var allProductsBrochures = new THREE.Group();
    allProductsBrochures.name = "brochuresGroup";
    allProductsBrochures.bottom = true;
    createItemModel(-100, null, null, "BROCHURES", "#0a70d6", allProductsBrochures, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1200, -300, -2730);
    allProductsGroupLevel2.add(allProductsBrochures);

    //6All Products -> Calendars
    var allProductsCalendars = new THREE.Group();
    allProductsCalendars.name = "calendarsGroup";
    allProductsCalendars.bottom = true;
    createItemModel(null, null, null, "CALENDARS", "#0a70d6", allProductsCalendars, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -200, -600, -2490);
    allProductsGroupLevel2.add(allProductsCalendars);

    //7All Products -> Canvas
    var allProductsCanvas = new THREE.Group();
    allProductsCanvas.name = "canvasGroup";
    allProductsCanvas.bottom = true;
    createItemModel(-80, 25, null, "CANVAS\nPRINTS", "#0a70d6", allProductsCanvas, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 150, -675, -2490);
    allProductsGroupLevel2.add(allProductsCanvas);


    //8All Products -> Desk Pads
    var allProductsDeskPads = new THREE.Group();
    allProductsDeskPads.name = "deskPadsGroup";
    allProductsDeskPads.bottom = true;
    createItemModel(null, null, null, "DESK PADS", "#0a70d6", allProductsDeskPads, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 500, -600, -2490);
    allProductsGroupLevel2.add(allProductsDeskPads);

    //9All Products -> Envelopes
    var allProductsEnvelopes = new THREE.Group();
    allProductsEnvelopes.name = "envelopesGroup";
    allProductsEnvelopes.bottom = true;
    createItemModel(null, null, null, "ENVELOPES", "#0a70d6", allProductsEnvelopes, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 850, -675, -2490);
    allProductsGroupLevel2.add(allProductsEnvelopes);

    //10All Products -> Envelopes
    var allProductsFlags = new THREE.Group();
    allProductsFlags.name = "flagsGroup";
    allProductsFlags.bottom = true;
    createItemModel(null, null, null, "FLAGS", "#0a70d6", allProductsFlags, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1200, -600, -2490);
    allProductsGroupLevel2.add(allProductsFlags);


    //Leaflets & Flyers
    var leafletsGroupLevel1 = new THREE.Group();
    leafletsGroupLevel1.name = "leaflets level 1";
    leafletsGroupLevel1.level1 = true;
    var leafletsGroupLevel2 = new THREE.Group();
    leafletsGroupLevel2.name = "leaflets level 2";
    leafletsGroupLevel2.level2 = true;
    var leafletsGroupLevel3 = new THREE.Group();
    leafletsGroupLevel3.position.set(0, 0, -3000);
    leafletsGroupLevel3.name = "leaflets level 3";
    leafletsGroupLevel3.level3 = true;
    leafletsGroupLevel3.bottom = true;

    leafletsGroup.add(leafletsGroupLevel1);
    leafletsGroupLevel1.add(leafletsGroupLevel2);
    leafletsGroupLevel2.add(leafletsGroupLevel3);

    createItemModel(null, null, null, "FLYERS &\nLEAFLETS", "#0a70d6", leafletsGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#ffffff", "#0a70d7", 100, 700, 750);

    //Leaflets & Flyers children

    //Leaflets & Flyers -> Size
    var leafletsSize = new THREE.Group();
    leafletsSize.name = "SIZE";
    leafletsSize.level2 = true;
    createItemModel(-50, null, null, "SIZE", "#0a70d6", leafletsSize, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -550, -200, -2805);
    leafletsGroupLevel2.visible = false;
    leafletsGroupLevel2.add(leafletsSize);

        //Leaflets & Flyers -> Size -> A7 Flyers & Leaflets
        var leafletsSizeA7 = new THREE.Group();
        leafletsSizeA7.name = "A7";
        createItemModel(null, null, null, "A7 FLYERS\n& LEAFLETS", "#0a70d6", leafletsSizeA7, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, 200, -2800);
        leafletsSize.add(leafletsSizeA7);

        //Leaflets & Flyers -> Size -> A6 Flyers & Leaflets
        var leafletsSizeA6 = new THREE.Group();
        createItemModel(null, null, null, "A6 FLYERS\n& LEAFLETS", "#0a70d6", leafletsSizeA6, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 350, 50, -2800);
        leafletsSize.add(leafletsSizeA6);

        //Leaflets & Flyers -> Size -> A5 Flyers & Leaflets
        var leafletsSizeA5 = new THREE.Group();
        createItemModel(null, null, null, "A5 FLYERS\n& LEAFLETS", "#0a70d6", leafletsSizeA5, leafletsSize, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 900, 150, -2800);
        leafletsSize.add(leafletsSizeA5);

        //Leaflets & Flyers -> Size -> A4 Flyers & Leaflets
        var leafletsSizeA4 = new THREE.Group();
        createItemModel(null, null, null, "A4 FLYERS\n& LEAFLETS", "#0a70d6", leafletsSizeA4, leafletsSize, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1400, -50, -2800);
        leafletsSize.add(leafletsSizeA4);

        //Leaflets & Flyers -> Size -> A3 Flyers & Leaflets
        var leafletsSizeA3 = new THREE.Group();
        createItemModel(null, null, null, "A3 FLYERS\n& LEAFLETS", "#0a70d6", leafletsSizeA3, leafletsSize, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1100, -350, -2500);
        leafletsSize.add(leafletsSizeA3);
        //leafletsGroupLevel3.add(leafletsSizeA3);

        //Leaflets & Flyers -> Size -> A3 Flyers & Leaflets
        var leafletsSizeDL = new THREE.Group();
        createItemModel(null, null, null, "DL FLYERS\n& LEAFLETS", "#0a70d6", leafletsSizeDL, leafletsSize, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 700, -400, -2500);
        leafletsSize.add(leafletsSizeDL);

        //Leaflets & Flyers -> Size -> FREE DESIGN TEMPLATES
        var leafletsSizeFreeDesign = new THREE.Group();
        createItemModel(-110, 25, null, "FREE DESIGN\nTEMPLATES", "#0a70d6", leafletsSizeFreeDesign, leafletsSize, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 100, -170, -2500);
        leafletsSize.add(leafletsSizeFreeDesign);


    //Leaflets & Flyers -> Folded
    var leafletsFolded = new THREE.Group();
    leafletsFolded.name = "FOLDED";
    leafletsFolded.level2 = true;
    createItemModel(-70, null, null, "FOLDED", "#0a70d6", leafletsFolded, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -150, -350, -2800);
    leafletsGroupLevel2.add(leafletsFolded);

        //Leaflets & Flyers -> Folded -> A5 Folded Leaflets
        var leafletsFoldedA5 = new THREE.Group();
        createItemModel(null, null, null, "FOLDED A5\nLEAFLETS", "#0a70d6", leafletsFoldedA5, leafletsFolded, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -200, 150, -2500);
        leafletsGroupLevel3.visible = false;
        leafletsFolded.add(leafletsFoldedA5);

        //Leaflets & Flyers -> Folded -> A4 Folded Leaflets
        var leafletsFoldedA4 = new THREE.Group();
        createItemModel(null, null, null, "FOLDED A4\nLEAFLETS", "#0a70d6", leafletsFoldedA4, leafletsFolded, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 100, -150, -2300);
        leafletsFolded.add(leafletsFoldedA4);

        //Leaflets & Flyers -> Folded -> A4 Folded Leaflets
        var leafletsFoldedA3 = new THREE.Group();
        createItemModel(null, null, null, "FOLDED A3\nLEAFLETS", "#0a70d6", leafletsFoldedA3, leafletsFolded, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 500, 150, -2500);
        leafletsFolded.add(leafletsFoldedA3);

        //Leaflets & Flyers -> Folded -> free design templates
        var leafletsFoldedTemplates = new THREE.Group();
        createItemModel(-110, 25, null, "FREE DESIGN\nTEMPLATES", "#0a70d6", leafletsFoldedTemplates, leafletsFolded, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 800, -150, -2300);
        leafletsFolded.add(leafletsFoldedTemplates);

    //Leaflets & Flyers -> Material
    var leafletsMaterial = new THREE.Group();
    leafletsMaterial.name = "MATERIAL";
    leafletsMaterial.level2 = true;
    createItemModel(null, null, null, "MATERIAL", "#0a70d6", leafletsMaterial, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 300, -250, -2790);
    leafletsGroupLevel2.add(leafletsMaterial);

        //Leaflets & Flyers -> Material -> economy flyers and leaflets
        var leafletsMaterialEconomy = new THREE.Group();
        createItemModel(-90, 28, null, "ECONOMY\nFLYERS &\nLEAFLETS", "#0a70d6", leafletsMaterialEconomy, leafletsMaterial, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -800, 150, -2300);
        leafletsMaterial.add(leafletsMaterialEconomy);

        //Leaflets & Flyers -> Material -> GLOSS flyers and leaflets
        var leafletsMaterialGloss = new THREE.Group();
        createItemModel(-120, 20, null, "GLOSS FLYERS\n& LEAFLETS", "#0a70d6", leafletsMaterialGloss, leafletsMaterial, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -400, -150, -2300);
        leafletsMaterial.add(leafletsMaterialGloss);

        //Leaflets & Flyers -> Material -> silk flyers and leaflets
        var leafletsMaterialSilk = new THREE.Group();
        createItemModel(-100, 22, null, "SILK FLYERS\n& LEAFLETS", "#0a70d6", leafletsMaterialSilk, leafletsMaterial, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 0, 150, -2300);
        leafletsMaterial.add(leafletsMaterialSilk);

        //Leaflets & Flyers -> Material -> bond flyers and leaflets
        var leafletsMaterialBond = new THREE.Group();
        createItemModel(-110, 22, null, "BOND FLYERS\n& LEAFLETS", "#0a70d6", leafletsMaterialBond, leafletsMaterial, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -150, -2300);
        leafletsMaterial.add(leafletsMaterialBond);


    //Leaflets & Flyers -> Style
    var leafletsStyle = new THREE.Group();
    leafletsStyle.name = "STYLE";
    leafletsStyle.level2 = true;
    createItemModel(-75, 15, null, "STYLE", "#0a70d6", leafletsStyle, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 750, -300, -2800);
    leafletsGroupLevel2.add(leafletsStyle);

        //Leaflets & Flyers -> Style -> creased flyers and leaflets
        var leafletsStyleCreased = new THREE.Group();
        createItemModel(-95, 27, null, "CREASED\nFLYERS &\nLEAFLETS", "#0a70d6", leafletsStyleCreased, leafletsStyle, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -1000, 75, -2300);
        leafletsStyle.add(leafletsStyleCreased);

        //Leaflets & Flyers -> Style -> PERFORATED flyers and leaflets
        var leafletsStylePerforated = new THREE.Group();
        createItemModel(-100, 28, null, "PERFORATED\nFLYERS &\nLEAFLETS", "#0a70d6", leafletsStylePerforated, leafletsStyle, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -400, 75, -2300);
        leafletsStyle.add(leafletsStylePerforated);


    //Business Cards
    var businessGroupLevel1 = new THREE.Group();
    businessGroupLevel1.name = "business level 1";
    businessGroupLevel1.level1 = true;
    var businessGroupLevel2 = new THREE.Group();
    businessGroupLevel2.name = "business level 2";
    businessGroupLevel2.level2 = true;
    var businessGroupLevel3 = new THREE.Group();
    businessGroupLevel3.position.set(0, 0, -3000);
    businessGroupLevel3.name = "business level 3";
    businessGroupLevel3.level3 = true;
    businessGroupLevel3.bottom = true;

    businessGroup.add(businessGroupLevel1);
    businessGroupLevel1.add(businessGroupLevel2);
    businessGroupLevel2.add(businessGroupLevel3);

    createItemModel(null, null, null, "BUSINESS\nCARDS", "#0a70d6", businessGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#ffffff", "#0a70d7", 450, 780, 750);

    //Business cards children

    //Business cards -> Single name
    var businessSingle = new THREE.Group();
    businessSingle.name = "SINGLE-NAME";
    businessSingle.level2 = true;
    createItemModel(-110, null, null, "SINGLE-NAME", "#0a70d6", businessSingle, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -800, -200, -2780);
    businessGroupLevel2.visible = false;
    businessGroupLevel2.add(businessSingle);

        //Business cards -> Single name -> Economy
        var businessSingleEcon = new THREE.Group();
        businessSingleEcon.name = "ECONOMY";
        createItemModel(null, null, null, "ECONOMY", "#0a70d6", businessSingleEcon, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -200, -100, -2800);
        businessSingle.add(businessSingleEcon);

        //Business cards -> Single name -> Spot UV
        var businessSingleSpot = new THREE.Group();
        businessSingleSpot.name = "SPOT UV";
        createItemModel(null, null, null, "SPOT UV", "#0a70d6", businessSingleSpot, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -200, -2800);
        businessSingle.add(businessSingleSpot);

        //Business cards -> Single name -> Kraft
        var businessSingleKraft = new THREE.Group();
        businessSingleKraft.name = "KRAFT";
        createItemModel(-70, 15, null, "KRAFT", "#0a70d6", businessSingleKraft, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1000, -300, -2800);
        businessSingle.add(businessSingleKraft);

    //Business cards -> Multi name
    var businessMulti = new THREE.Group();
    businessMulti.name = "MULTI-NAME";
    businessMulti.level2 = true;
    createItemModel(-100, null, null, "MULTI-NAME", "#0a70d6", businessMulti, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -300, -300, -2780);
    businessGroupLevel2.visible = false;
    businessGroupLevel2.add(businessMulti);

        //Business cards -> Multi name -> Economy
        var businessMultiEcon = new THREE.Group();
        businessMultiEcon.name = "ECONOMY";
        createItemModel(null, null, null, "ECONOMY", "#0a70d6", businessMultiEcon, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -600, -100, -2800);
        businessMulti.add(businessMultiEcon);

        //Business cards -> Multi name -> Velvet Laminated
        var businessMultiVelvet = new THREE.Group();
        businessMultiVelvet.name = "VELVET LAMINATED";
        createItemModel(null, null, null, "VELVET\nLAMINATED", "#0a70d6", businessMultiVelvet, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -200, -2800);
        businessMulti.add(businessMultiVelvet);

        //Business cards -> Multi name -> Gloss Laminated
        var businessMultiGloss = new THREE.Group();
        businessMultiGloss.name = "GLOSS LAMINATED";
        createItemModel(null, null, null, "GLOSS\nLAMINATED", "#0a70d6", businessMultiGloss, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -300, -2800);
        businessMulti.add(businessMultiGloss);

    //Business cards -> Style
    var businessStyle = new THREE.Group();
    businessStyle.name = "STYLE";
    businessStyle.level2 = true;
    createItemModel(-75, 15, null, "STYLE", "#0a70d6", businessStyle, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 200, -400, -2700);
    businessGroupLevel2.visible = false;
    businessGroupLevel2.add(businessStyle);

        //Business cards -> Style -> Square
        var businessStyleSquare = new THREE.Group();
        businessStyleSquare.name = "SQUARE";
        createItemModel(-80, 15, null, "SQUARE", "#0a70d6", businessStyleSquare, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -1000, 0, -2800);
        businessStyle.add(businessStyleSquare);

        //Business cards -> Style -> Square
        var businessStyleMini = new THREE.Group();
        businessStyleMini.name = "MINI";
        createItemModel(-50, 0, null, "MINI", "#0a70d6", businessStyleMini, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -500, -100, -2800);
        businessStyle.add(businessStyleMini);

        //Business cards -> Style -> Rounded Corners
        var businessStyleRounded = new THREE.Group();
        businessStyleRounded.name = "ROUNDED CORNERS";
        createItemModel(null, null, null, "ROUNDED\nCORNERS", "#0a70d6", businessStyleRounded, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 0, -200, -2800);
        businessStyle.add(businessStyleRounded);

    //Brochures
    var brochuresGroupLevel1 = new THREE.Group();
    brochuresGroupLevel1.name = "brochures level 1";
    brochuresGroupLevel1.level1 = true;
    var brochuresGroupLevel2 = new THREE.Group();
    brochuresGroupLevel2.name = "brochures level 2";
    brochuresGroupLevel2.level2 = true;
    var brochuresGroupLevel3 = new THREE.Group();
    brochuresGroupLevel3.position.set(0, 0, -3000);
    brochuresGroupLevel3.name = "brochures level 3";
    brochuresGroupLevel3.level3 = true;
    brochuresGroupLevel3.bottom = true;

    brochuresGroup.add(brochuresGroupLevel1);
    brochuresGroupLevel1.add(brochuresGroupLevel2);
    brochuresGroupLevel2.add(brochuresGroupLevel3);

    createItemModel(-100, 0, null, "BROCHURES", "#0a70d6", brochuresGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#ffffff", "#0a70d7", 800, 650, 750);

    //Brochures children

    //Brochures -> Size
    var brochuresSize = new THREE.Group();
    brochuresSize.name = "SIZE";
    brochuresSize.level2 = true;
    createItemModel(-60, 0, null, "SIZE", "#0a70d6", brochuresSize, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -1100, -100, -2770);
    brochuresGroupLevel2.visible = false;
    brochuresGroupLevel2.add(brochuresSize);

        //Brochures -> Size -> A6 Stapled Brochures
        var brochuresSizeA6 = new THREE.Group();
        brochuresSizeA6.name = "A6";
        createItemModel(null, null, null, "A6 STAPLED\nBROCHURES", "#0a70d6", brochuresSizeA6, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -100, -2800);
        brochuresSize.add(brochuresSizeA6);

        //Brochures -> Size -> A5 Stapled Brochures
        var brochuresSizeA5 = new THREE.Group();
        brochuresSizeA5.name = "A5";
        createItemModel(null, null, null, "A5 STAPLED\nBROCHURES", "#0a70d6", brochuresSizeA5, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 300, -175, -2800);
        brochuresSize.add(brochuresSizeA5);

        //Brochures -> Size -> A4 Stapled Brochures
        var brochuresSizeA4 = new THREE.Group();
        brochuresSizeA4.name = "A4";
        createItemModel(null, null, null, "A4 STAPLED\nBROCHURES", "#0a70d6", brochuresSizeA4, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 700, -250, -2800);
        brochuresSize.add(brochuresSizeA4);

        //Brochures -> Size -> A4 Stapled Brochures
        var brochuresSizeSquare = new THREE.Group();
        brochuresSizeSquare.name = "SQUARE STAPLED BROCHURES";
        createItemModel(-90, 28, null, "SQUARE\nSTAPLED\nBROCHURES", "#0a70d6", brochuresSizeSquare, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1100, -325, -2800);
        brochuresSize.add(brochuresSizeSquare);

    //Brochures -> Style
    var brochuresStyle = new THREE.Group();
    brochuresStyle.name = "STYLE";
    brochuresStyle.level2 = true;
    createItemModel(-70, 10, null, "STYLE", "#0a70d6", brochuresStyle, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -600, -200, -2710);
    brochuresGroupLevel2.add(brochuresStyle);

        //Brochures -> Style -> Stapled Brochures
        var brochuresStyleStapled = new THREE.Group();
        brochuresStyleStapled.name = "STAPLED";
        createItemModel(null, null, null, "STAPLED\nBROCHURES", "#0a70d6", brochuresStyleStapled, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -600, -50, -2800);
        brochuresStyle.add(brochuresStyleStapled);

        //Brochures -> Style -> Perfect Bound Brochures
        var brochuresStylePerfect = new THREE.Group();
        brochuresStylePerfect.name = "PERFECT BOUND";
        createItemModel(-90, 28, null, "PERFECT\nBOUND\nBROCHURES", "#0a70d6", brochuresStylePerfect, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -150, -2800);
        brochuresStyle.add(brochuresStylePerfect);

        //Brochures -> Style -> Wiro Bound Brochures
        var brochuresStyleWiro = new THREE.Group();
        brochuresStyleWiro.name = "WIRO BOUND";
        createItemModel(-90, 28, null, "WIRO\nBOUND\nBROCHURES", "#0a70d6", brochuresStyleWiro, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -250, -2800);
        brochuresStyle.add(brochuresStyleWiro);


    //Brochures -> Type
    var brochuresType = new THREE.Group();
    brochuresType.name = "TYPE";
    brochuresType.level2 = true;
    createItemModel(-60, 0, null, "TYPE", "#0a70d6", brochuresType, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -300, -2750);
    brochuresGroupLevel2.add(brochuresType);

        //Brochures -> Type -> order of service
        var brochuresTypeOrder = new THREE.Group();
        brochuresTypeOrder.name = "ORDER OF SERVICE";
        createItemModel(-90, 25, null, "ORDER\nOF\nSERVICE", "#0a70d6", brochuresTypeOrder, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -500, 150, -2600);
        brochuresType.add(brochuresTypeOrder);


    //Roller Banners
    var bannersGroupLevel1 = new THREE.Group();
    bannersGroupLevel1.name = "banners level 1";
    bannersGroupLevel1.level1 = true;
    var bannersGroupLevel2 = new THREE.Group();
    bannersGroupLevel2.name = "banners level 2";
    bannersGroupLevel2.level2 = true;
    var bannersGroupLevel3 = new THREE.Group();
    bannersGroupLevel3.position.set(0, 0, -3000);
    bannersGroupLevel3.name = "banners level 3";
    bannersGroupLevel3.level3 = true;
    bannersGroupLevel3.bottom = true;

    bannersGroup.add(bannersGroupLevel1);
    bannersGroupLevel1.add(bannersGroupLevel2);
    bannersGroupLevel2.add(bannersGroupLevel3);

    createItemModel(-80, 22, null, "ROLLER\nBANNERS", "#0a70d6", bannersGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#ffffff", "#0a70d7", -150, 350, 850);

    //Roller Banners children

    //Roller Banners -> Type
    var bannersType = new THREE.Group();
    bannersType.name = "TYPE";
    bannersType.level2 = true;
    createItemModel(-60, 10, null, "TYPE", "#0a70d6", bannersType, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, 250, -2855);
    bannersGroupLevel2.visible = false;
    bannersGroupLevel2.add(bannersType);

        //Banners -> Type -> Pull Up Roller Banners
        var bannersPull = new THREE.Group();
        bannersPull.name = "PULL UP";
        createItemModel(-85, 25, null, "PULL UP\nROLLER\nBANNERS", "#0a70d6", bannersPull, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -100, -2800);
        bannersType.add(bannersPull);

        //Banners -> Type -> L Banners
        var bannersL = new THREE.Group();
        bannersL.name = "L BANNERS";
        createItemModel(-90, 15, null, "L BANNERS", "#0a70d6", bannersL, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 450, -100, -2800);
        bannersType.add(bannersL);

        //Banners -> Type -> Premium Roller Banners
        var bannersPremium = new THREE.Group();
        bannersPremium.name = "PREMIUM BANNERS";
        createItemModel(-85, 25, null, "PREMIUM\nROLLER\nBANNERS", "#0a70d6", bannersPremium, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1000, -100, -2800);
        bannersType.add(bannersPremium);

        //Banners -> Type -> DOUBLE SIDED Roller Banners
        var bannersDouble = new THREE.Group();
        bannersDouble.name = "DOUBLE SIDED";
        createItemModel(-80, 36, null, "DOUBLE\nSIDED\nROLLER\nBANNERS", "#0a70d6", bannersDouble, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -500, -2800);
        bannersType.add(bannersDouble);

        //Banners -> Type -> WIDE Roller Banners
        var bannersWide = new THREE.Group();
        bannersWide.name = "WIDE ROLLER";
        createItemModel(-80, 28, null, "WIDE\nROLLER\nBANNERS", "#0a70d6", bannersWide, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 450, -500, -2800);
        bannersType.add(bannersWide);

        //Banners -> Type -> Desktop Roller Banners
        var bannersDesktop = new THREE.Group();
        bannersDesktop.name = "DESKTOP";
        createItemModel(-85, 25, null, "DESKTOP\nROLLER\nBANNERS", "#0a70d6", bannersDesktop, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 1000, -500, -2800);
        bannersType.add(bannersDesktop);

    //Roller Banners -> Promotional
    var bannersPromo = new THREE.Group();
    bannersPromo.name = "PROMOTIONAL";
    bannersPromo.level2 = true;
    createItemModel(-115, 10, null, "PROMOTIONAL", "#0a70d6", bannersPromo, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, 250, -2855);
    bannersGroupLevel2.add(bannersPromo);

        //Roller Banners -> Promotional
        var bannersExhibition = new THREE.Group();
        bannersExhibition.name = "EXHIBITION";
        createItemModel(null, null, null, "EXHIBITION\nSTANDS", "#0a70d6", bannersExhibition, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -100, -2500);
        bannersPromo.add(bannersExhibition);


    //Posters
    var postersGroupLevel1 = new THREE.Group();
    postersGroupLevel1.name = "posters level 1";
    postersGroupLevel1.level1 = true;
    var postersGroupLevel2 = new THREE.Group();
    postersGroupLevel2.name = "posters level 2";
    postersGroupLevel2.level2 = true;
    var postersGroupLevel3 = new THREE.Group();
    postersGroupLevel3.position.set(0, 0, -3000);
    postersGroupLevel3.name = "posters level 3";
    postersGroupLevel3.level3 = true;
    postersGroupLevel3.bottom = true;

    postersGroup.add(postersGroupLevel1);
    postersGroupLevel1.add(postersGroupLevel2);
    postersGroupLevel2.add(postersGroupLevel3);

    createItemModel(-85, 10, null, "POSTERS", "#0a70d6", postersGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#ffffff", "#0a70d7", 275, 375, 850);

    //Posters children

    //Posters -> Size
    var postersSize = new THREE.Group();
    postersSize.name = "SIZE";
    postersSize.level2 = true;
    createItemModel(-60, 15, null, "SIZE", "#0a70d6", postersSize, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -500, 250, -2800);
    postersGroupLevel2.visible = false;
    postersGroupLevel2.add(postersSize);

        //Posters -> Size -> A4 Posters
        var postersA4 = new THREE.Group();
        postersA4.name = "A4 POSTERS";
        createItemModel(-100, 12, null, "A4 POSTERS", "#0a70d6", postersA4, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -100, -2800);
        postersSize.add(postersA4);

        //Posters -> Size -> A3 Posters
        var postersA3 = new THREE.Group();
        postersA3.name = "A3 POSTERS";
        createItemModel(-100, 12, null, "A3 POSTERS", "#0a70d6", postersA3, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -200, -2800);
        postersSize.add(postersA3);

        //Posters -> Size -> A2 Posters
        var postersA2 = new THREE.Group();
        postersA2.name = "A2 POSTERS";
        createItemModel(-100, 12, null, "A2 POSTERS", "#0a70d6", postersA2, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 900, -300, -2800);
        postersSize.add(postersA2);

    //Posters -> Type
    var postersType = new THREE.Group();
    postersType.name = "TYPE";
    postersType.level2 = true;
    createItemModel(-60, 15, null, "TYPE", "#0a70d6", postersType, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 0, 200, -2800);
    postersGroupLevel2.add(postersType);

        //Posters -> Type -> Gloss Posters
        var postersGloss = new THREE.Group();
        postersGloss.name = "GLOSS POSTERS";
        createItemModel(-80, 18, null, "GLOSS\nPOSTERS", "#0a70d6", postersGloss, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -600, -100, -2800);
        postersType.add(postersGloss);

        //Posters -> Type -> Bond Posters
        var postersBond = new THREE.Group();
        postersBond.name = "BOND POSTERS";
        createItemModel(-80, 18, null, "BOND\nPOSTERS", "#0a70d6", postersBond, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, -200, -2800);
        postersType.add(postersBond);

        //Posters -> Type -> DAY GLO Posters
        var postersDayGlo = new THREE.Group();
        postersDayGlo.name = "DAY GLO POSTERS";
        createItemModel(null, null, null, "DAY GLOW\nPOSTERS", "#0a70d6", postersDayGlo, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -300, -2800);
        postersType.add(postersDayGlo);

    //Posters -> Promotional
    var postersPromo = new THREE.Group();
    postersPromo.name = "PROMOTIONAL";
    postersPromo.level2 = true;
    createItemModel(-115, 15, null, "PROMOTIONAL", "#0a70d6", postersPromo, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 500, 150, -2850);
    postersGroupLevel2.add(postersPromo);

        //Posters -> Promotional -> Back lit light box Posters
        var postersBackLit = new THREE.Group();
        postersBackLit.name = "BACK LIT POSTERS";
        createItemModel(null, null, null, "BACK LIT\nLIGHT BOX\nPOSTERS", "#0a70d6", postersBackLit, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -600, -100, -2700);
        postersPromo.add(postersBackLit);


    //Free Online Designs
    var designsGroupLevel1 = new THREE.Group();
    designsGroupLevel1.name = "designs level 1";
    designsGroupLevel1.level1 = true;
    var designsGroupLevel2 = new THREE.Group();
    designsGroupLevel2.name = "designs level 2";
    designsGroupLevel2.level2 = true;
    var designsGroupLevel3 = new THREE.Group();
    designsGroupLevel3.position.set(0, 0, -3000);
    designsGroupLevel3.name = "designs level 3";
    designsGroupLevel3.level3 = true;
    designsGroupLevel3.bottom = true;

    designsGroup.add(designsGroupLevel1);
    designsGroupLevel1.add(designsGroupLevel2);
    designsGroupLevel2.add(designsGroupLevel3);

    createItemModel(-110, 23, null, "FREE ONLINE\nDESIGNS", "#0a70d6", designsGroupLevel1, null, "#EEEFF2", "#E0CAD5", "#ffffff", "#0a70d7", 700, 350, 800);

    //Free Online Designs children

    //Free Online Designs -> Custom templates
    var designsCustom = new THREE.Group();
    designsCustom.name = "CUSTOM";
    designsCustom.level2 = true;
    createItemModel(null, null, null, "CUSTOM\nTEMPLATES", "#0a70d6", designsCustom, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -1000, 200, -2840);
    designsGroupLevel2.visible = false;
    designsGroupLevel2.add(designsCustom);

        //Free Online Designs -> Custom templates -> Business Cards
        var designsCustBusiness = new THREE.Group();
        designsCustBusiness.name = "BUSINESS CARDS";
        createItemModel(null, null, null, "BUSINESS\nCARDS", "#0a70d6", designsCustBusiness, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -100, 0, -2800);
        designsCustom.add(designsCustBusiness);

        //Free Online Designs -> Custom templates -> Invitations
        var designsCustInvitations = new THREE.Group();
        designsCustInvitations.name = "INVITATIONS";
        createItemModel(null, null, null, "INVITATIONS", "#0a70d6", designsCustInvitations, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 400, -100, -2800);
        designsCustom.add(designsCustInvitations);


        //Free Online Designs -> Custom templates -> Greeting Cards
        var designsCustGreeting = new THREE.Group();
        designsCustGreeting.name = "GREETING CARDS";
        createItemModel(-80, 18, null, "GREETING\nCARDS", "#0a70d6", designsCustGreeting, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 900, -200, -2800);
        designsCustom.add(designsCustGreeting);


    //Free Online Designs -> Blank templates
    var designsBlank = new THREE.Group();
    designsBlank.name = "BLANK";
    designsBlank.level2 = true;
    createItemModel(null, null, null, "BLANK\nTEMPLATES", "#0a70d6", designsBlank, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -500, 150, -2800);
    designsGroupLevel2.add(designsBlank);

        //Free Online Designs -> Blank templates -> Business Cards
        var designsblankBusiness = new THREE.Group();
        designsblankBusiness.name = "BUSINESS CARDS";
        createItemModel(null, null, null, "BUSINESS\nCARDS", "#0a70d6", designsblankBusiness, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -500, 0, -2800);
        designsBlank.add(designsblankBusiness);

        //Free Online Designs -> Blank templates -> Invitations
        var designsBlankInvitations = new THREE.Group();
        designsBlankInvitations.name = "INVITATIONS";
        createItemModel(null, null, null, "INVITATIONS", "#0a70d6", designsBlankInvitations, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 0, -100, -2800);
        designsBlank.add(designsBlankInvitations);


        //Free Online Designs -> Blank templates -> Greeting Cards
        var designsBlankGreeting = new THREE.Group();
        designsBlankGreeting.name = "GREETING CARDS";
        createItemModel(-80, 18, null, "GREETING\nCARDS", "#0a70d6", designsBlankGreeting, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 500, -200, -2800);
        designsBlank.add(designsBlankGreeting);

    //Free Online Designs -> Seasonal
    var designsSeasonal = new THREE.Group();
    designsSeasonal.name = "SEASONAL";
    designsSeasonal.level2 = true;
    createItemModel(null, null, null, "SEASONAL", "#0a70d6", designsSeasonal, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 0, 100, -2800);
    designsGroupLevel2.add(designsSeasonal);

        //Free Online Designs -> Seasonal -> Christmas Cards
        var designsSeasonalXmasCards = new THREE.Group();
        designsSeasonalXmasCards.name = "CHRISTMAS CARDS";
        createItemModel(null, null, null, "CHRISTMAS\nCARDS", "#0a70d6", designsSeasonalXmasCards, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -1000, 0, -2800);
        designsSeasonal.add(designsSeasonalXmasCards);

        //Free Online Designs -> Seasonal -> Christmas Invitations
        var designsSeasonalXmasInvitations = new THREE.Group();
        designsSeasonalXmasInvitations.name = "CHRISTMAS INVITATIONS";
        createItemModel(null, null, null, "CHRISTMAS\nINVITATIONS", "#0a70d6", designsSeasonalXmasInvitations, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", -450, -100, -2800);
        designsSeasonal.add(designsSeasonalXmasInvitations);

        //Free Online Designs -> Seasonal -> New Year Invitations
        var designsSeasonalNYInvitations = new THREE.Group();
        designsSeasonalNYInvitations.name = "NEW YEAR INVITATIONS";
        createItemModel(null, null, null, "NEW YEAR\nINVITATIONS", "#0a70d6", designsSeasonalNYInvitations, null, "#EEEFF2", "#E0CAD5", "#EEEFF2", "#0a70d7", 100, -200, -2800);
        designsSeasonal.add(designsSeasonalNYInvitations);


    scene.add(allProductsGroup);
    scene.add(leafletsGroup);
    scene.add(businessGroup);
    scene.add(brochuresGroup);
    scene.add(bannersGroup);
    scene.add(postersGroup);
    scene.add(designsGroup);
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

        if (activeItem.level1 && activeItem.parent.name) {
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
        systemLocation();
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

}

//Hide all children in the scene below the top layer.
function hideAllChildren() {
    for (var i = 1; i < scene.children.length; i++) {
        scene.children[i].children[0].children[0].visible = false;
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

    transitionLoop();
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

init();
