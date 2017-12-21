// Under creative commons licence see: https://creativecommons.org/
// Github repo: https://github.com/hedgehog125/JAMESCRIPT

// Tinylib

fileUploadElement = document.createElement("p")
fileUploadElement.id = "FileUpload"
fileUploadElement.hidden = true
document.body.appendChild(fileUploadElement)

var fpsCalc = {	startTime : 0,	frameNumber : 0,	getFPS : function(){		this.frameNumber++;		var d = new Date().getTime(),			currentTime = ( d - this.startTime ) / 1000,			result = Math.floor( ( this.frameNumber / currentTime ) );		if( currentTime > 1 ){			this.startTime = new Date().getTime();			this.frameNumber = 0;		}		return result;	}	};

function asciiToUTF(ascii) {
	return String.fromCharCode(ascii).toLowerCase()
}

function getEl(id) {
	return document.getElementById(id)
}

function range(start, stop, step) {
	// From https://stackoverflow.com/questions/8273047/javascript-function-similar-to-python-range
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start
        start = 0
    }

    if (typeof step == 'undefined') {
        step = 1
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return []
    }

    var result = []
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i)
    }

    return result
}

function post(url, data, code) {
	// From https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest and https://stackoverflow.com/questions/18962799/javascript-http-post-with-json-data
    http = new XMLHttpRequest()
	var params = JSON.stringify(data)
	http.open("POST", url, true)

	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json")

	http.onreadystatechange = function() {
		if (http.readyState == 4) {
			code()
		}
	}
	http.send(params)
}

function get(url, func) {
	// From https://stackoverflow.com/questions/9713058/send-post-data-using-xmlhttprequest and https://stackoverflow.com/questions/18962799/javascript-http-post-with-json-data
    http = new XMLHttpRequest()
	http.open("GET", url, true)
	code = func
	http.onreadystatechange = function() {
		if (http.readyState == 4) {
			code()
		}
	}
	http.send()
}

function save(data,filename) {
	// based off https://thiscouldbebetter.wordpress.com/2012/12/18/loading-editing-and-saving-a-text-file-in-html5-using-javascrip/
    var textToSave = data
    var textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"})
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob)
    var fileNameToSaveAs = filename

    var downloadLink = document.createElement("a")
    downloadLink.download = fileNameToSaveAs
    downloadLink.innerHTML = "Download File"
    downloadLink.href = textToSaveAsURL
    downloadLink.onclick = function(event) { document.body.removeChild(event.target) }
    downloadLink.style.display = "none"
    document.body.appendChild(downloadLink)

    downloadLink.click()
}

function fileUpload(code,multiple) {
    // Based off https://stackoverflow.com/questions/10906734/how-to-upload-image-into-html5-canvas.
    if (multiple) {
    	document.getElementById("FileUpload").innerHTML = '<input multiple type="file" id="imageLoader" name="imageLoader" style="visibility:hidden" />'
    }
    else {
    	document.getElementById("FileUpload").innerHTML = '<input type="file" id="imageLoader" name="imageLoader" style="visibility:hidden" />'
    }
    uploadCode = code
    file = 0

    imageLoader = document.getElementById('imageLoader')

    handleImage = function(e) {
        uploadReader = new FileReader()
        uploadReader.onload = function(event) {
        	src = event.target.result
        	uploadCode()
            imageLoader = undefined
            document.getElementById("FileUpload").innerHTML = ""
            handleImage = undefined
            file++
            if (e.target.files[file] != undefined) {
            	uploadReader.readAsDataURL(e.target.files[file])
            }
        }
        uploadReader.readAsDataURL(e.target.files[0])
    }

    imageLoader.addEventListener('change', handleImage, false)
    document.getElementById("imageLoader").click()
}

function cancelUpload() {
    uploadCode = ""
    imageLoader = undefined
    document.getElementById("FileUpload").innerHTML = ""
    uploadImg = undefined
}

// JAMESCRIPT

if (! ("Phaser" in window)) {
	throw "JAMESCRIPT: Fatal error: Phaser has not been initialised."
}
if (! ("state" in window)) {
	state = []
}
if (! ("Assets" in window)) {
	throw new Error("JAMESCRIPT: Fatal Error: Assets has not been defined.")
}
if (getEl("game") == null) {
	throw new Error("JAMESCRIPT: Fatal Error: Unable to find GameFrame: Element with the id of 'game' doesn't exist.")
}

if (! ("doubleScriptsAllowed" in window)) {
	doubleScriptsAllowed = true
}

// Check the JSON...
if (! ("scripts" in Assets)) {
	throw new Error("JAMESCRIPT: Fatal Error: 'scripts' does not exist in the JSON.")
}

cloneCount = 0


Loaded = {
	"snds": {}
}


document.bgColor = "black"

GameFrame = getEl("game")
window.addEventListener("touchmove", function(e) {
	e.preventDefault()
}, true)

var errors = 0

window.onerror = function (msg, url, lineNo, columnNo, error) { // From https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
    var string = msg.toLowerCase();
    var substring = "script error";
    if (string.indexOf(substring) > -1){
        alert('Script Error: See Browser Console for Detail');
    } else {
        var message = [
            'Message: ' + msg,
            'URL: ' + url,
            'Line: ' + lineNo,
            'Column: ' + columnNo,
            'Error object: ' + JSON.stringify(error)
        ].join(' - ');

		errors++ // I added this.
        alert(message);
    }

    return false;
};

var width = 800
var height = 450
var currentFPS = "?"

var fadeDotError = [
	"JAMESCRIPT: Fatal Error: No image to run speedtest on.",
	"This could be because the FadeDot image is missing.",
	"To fix this error:",
	"1) Paint a single black pixel." ,
	"2) Put it in assets/imgs.",
	"3) Name it 'fade'.",
	"4) Make sure it has the extention '.png'.",
	"5) Load it into assets as 'FadeDot'."
].join("\n")

if (! ("useCanvas" in window)) {
	useCanvas = false
}

function testRenderers() {
	console.log("JAMESCRIPT: Running speedtest...")
	Game = new Phaser.Game(width, height, Phaser.AUTO, "game", null, false, false)
	testTick = 0
	Game.state.add("Test", {
		"preload": function() {
			var er = false
			if (Assets["imgs"] == undefined) {
				var er = true
			}
			else {
				if (Assets["imgs"][0] == undefined) {
					var er = true
				}
			}
			if (er) {
				throw new Error(fadeDotError)
			}

			Game.load.image("test", "assets/imgs/" + Assets["imgs"][0]["src"])
		},
		"create": function() {
			var i = 0
			while (i < 300) {
				var sprite = Game.add.sprite(Game.rnd.integerInRange(0, Game.width), Game.rnd.integerInRange(0, Game.height), "test")
				sprite.width = Game.width
				sprite.height = Game.height
				i++
			}
			avgFPS = {}
			avgFPS.total = 0
			avgFPS.samples = 0
			avgFPS.value = 0
		},
		"update": function() {
			if (testTick == 120) {
				console.log("JAMESCRIPT: AUTO achieved " + avgFPS.value + " FPS.")
				if (useCanvas) {
					console.log("JAMESCRIPT: 'useCanvas' is true. Switching to canvas mode...")
				}
				else {
					if (avgFPS.value < 50) {
						mode = Phaser.CANVAS
						console.log("JAMESCRIPT: FPS is low, WebGL is slow. Switching to canvas mode...")
					}
					else {
						mode = Phaser.AUTO
						console.log("JAMESCRIPT: FPS is fine, AUTO is fine.")
					}
				}


				console.log("\n \n")

				setTimeout(function() {
					Game.destroy()
					Game = new Phaser.Game(width, height, mode, "game", null, false, false)
					console.log("Begining loading assets...")
					console.log("\n")
					setTimeout(setup, 30)
				}, 0)
			}
			testTick++
			currentFPS = fpsCalc.getFPS()

			avgFPS.samples++
			avgFPS.total = avgFPS.total + currentFPS
			avgFPS.value = Math.round(avgFPS.total / avgFPS.samples)
		}
	})
	Game.state.start("Test")
}
testRenderers()

Sprites = {}
SpritesIndex = {}

stateWas = state
scriptTimes = {}
resetScriptTimes = {}
mainScriptTimes = {"before": {}, "after": {}}
mainResetScriptTimes = {}
cloneMainScripts = {}
cloneResetScripts = {}
spriteCloneIds = {}
time = "?"
touchscreen = window.ontouchstart !== undefined
functionForClone = null
autoStart = true
doubleScripts = false
myID = null

currentFade = {
	"active": false,
	"speed": 0,
	"newState": null
}

finishLoading = function() {
	var i = 0
	for (i in Assets["snds"]) {
		if (Assets["snds"][i]["markers"] !== undefined) {
			var audio = Game.add.audio(Assets["snds"][i]["id"])
			var c = 0
			for (c in Assets["snds"][i]["markers"]) {
				var a = Assets["snds"][i]["markers"][c]
				audio.addMarker(a["id"], a["start"], a["end"] - a["start"], 1, a["repeat"])
			}
			Loaded["snds"][Assets["snds"][i]["id"]] = audio
		}
		else {
			Loaded["snds"][Assets["snds"][i]["id"]] = Game.add.audio(Assets["snds"][i]["id"])
		}
	}
	loadingText.destroy()

	fadeDot = Game.add.sprite(0, 0, "Fade_Dot")
	fadeDot.width = Game.world.width
	fadeDot.height = Game.world.height
	fadeDot.fixedToCamera = true
	fadeDot.visible = false

	create()
}

GameState = {
	"preload": finishLoading,
	"update": main
}

LoadingState = {
	"preload": function() {
		Game.load.onLoadComplete.add(function() {
			setTimeout(function() {
				if (touchscreen) {
					loadingText.setText("Tap to start.")
				}
				else {
					loadingText.setText("Click to start.")
				}
				waitDown = false
				wait = setInterval(function() {
					if ((! Game.input.activePointer.isDown) && waitDown || autoStart) {
						Game.state.start("GameState")

						setTimeout(function() {
							if (currentFPS <= 31) {
								console.warn("JAMESCRIPT: Your browser seems to be running the main script at half the speed it should. This will mean the game won't work properly. \n JAMESCRIPT will still work, but it may behave unexpectedly.")
								doubleScripts = true
								if (! doubleScriptsAllowed) {
									alert("JAMESCRIPT: Your browser seems to be running the main script at half the speed it should. This will mean the game won't work properly.")
									GameFrame.parentNode.removeChild(GameFrame)
								}
							}
						}, 2000)
						clearInterval(wait)
					}
					if (Game.input.activePointer.isDown) {
						waitDown = true
					}
				}, 30)
			}, 500)
		}, Game)
		loadingText = Game.add.text(Game.world.centerX, Game.world.centerY, "Loading... 0%", {
			"font": "50px Arial",
			"fill": "#FFFFFF",
		})
		loadingText.anchor.setTo(0.5)
		GameFrame.hidden = false
		Game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
		Game.scale.pageAlignHorizontally = true
		Game.scale.pageAlignVertically = true
	},
	"create": function() {
		Game.load.image("Fade_Dot", "assets/imgs/fade.png")
		numberOfAssets = 1
		loaded = 0
		imagesToScan = {}

		var i = 0
		for (i in Assets["imgs"]) {
			Game.load.image(Assets["imgs"][i]["id"], "assets/imgs/" + Assets["imgs"][i]["src"])
			if (Assets["imgs"][i]["scan"]) {
				imagesToScan[Assets["imgs"][i]["id"]] = true
			}
			numberOfAssets++
		}
		var i = 0
		for (i in Assets["snds"]) {
			Game.load.audio(Assets["snds"][i]["id"], "assets/sounds/" + Assets["snds"][i]["src"])
			numberOfAssets++
		}

		Game.load.onFileComplete.add(function(progress, image) {
			loaded++
			loadingText.setText("Loading... " + Math.floor((loaded / numberOfAssets) * 100) + "%")


			if (imagesToScan[image]) { // Scan the image...
				collision.scan(Game.cache.getImage(image), image)
			}
		})
		Game.load.start()
	}
}

function deleteCloneByName(name) {
	if (Sprites[name] !== undefined) {
		cloneCount--
		Sprites[name].destroy()

		var splitName = name.split("#")
		spriteCloneIds[splitName[0]][splitName[1]] = undefined
	}
}

function setup() {
	if ("prescript" in Assets) {
		Assets["prescript"]()
	}
	Game.state.add("Load", LoadingState)
	Game.state.add("GameState", GameState)
	Game.state.start("Load")
}

function is_defined(x) {
	return x != undefined
}

function removeUndefined(ob) {
	return ob.filter(is_defined)
}

function preload() {

}

function updateFrame(frameId, bitmap) {
	Sprites[frameId].loadTexture(Sprites[bitmap])
}

function playSound(id, loop, marker, onStop) {
	if (loop) {
		Loaded["snds"][id].loop = true
	}
	else {
		Loaded["snds"][id].loop = false
	}
	if (onStop !== undefined) {
		Loaded["snds"][id].onStop.addOnce(onStop)
	}

	Loaded["snds"][id].currentTime = 0
	Loaded["snds"][id].play(marker)
}

function stopSound(id) {
	Loaded["snds"][id].stop()
}

function beginFade(speed, newState, stoptime) {
	currentFade = {
		"tick": 0,
		"speed": speed,
		"stopTime": stoptime,
		"newState": newState
	}
	fadeDot.visible = true
}

function move(dis) {
	var rad = Game.math.degToRad(me.angle)
	me.x = me.x + Math.cos(rad) * dis
	me.y = me.y + Math.sin(rad) * dis
}

function getAngleBetweenSprites(sprite1, sprite2) {
	return Game.math.radToDeg(Game.physics.arcade.angleBetween(sprite1, sprite2))
}

function moveToSprite(sprite1, sprite2, speed) {
	Game.physics.arcade.moveToObject(sprite1, sprite2, speed)
}

function filter(r, g, b, a) {
	return (a * Math.pow(256, 3)) + (r * Math.pow(256, 2)) + (g * 256) + b
}

function brightness(effect) {
	var e = effect
	return filter(e, e, e, 0)
}


function getCentreX(spriteID) {
	if (spriteID == undefined) {
		return (me.x - (me.anchor.x * me.width)) + (me.width / 2)
	}
	return (Sprites[spriteID].x - (Sprites[spriteID].anchor.x * Sprites[spriteID].width)) + (Sprites[spriteID].width / 2)
}
function getLeftX(spriteID) {
	if (spriteID == undefined) {
		return me.x - (me.anchor.x * me.width)
	}
	return Sprites[spriteID].x - (Sprites[spriteID].anchor.x * Sprites[spriteID].width)
}
function getRightX(spriteID) {
	if (spriteID == undefined) {
		return (me.x - (me.anchor.x * me.width)) + me.width
	}
	return (Sprites[spriteID].x - (Sprites[spriteID].anchor.x * Sprites[spriteID].width)) + Sprites[spriteID].width
}

function getCentreY(spriteID) {
	if (spriteID == undefined) {
		return (me.y - (me.anchor.y * me.height)) + (me.height / 2)
	}
	return (Sprites[spriteID].y - (Sprites[spriteID].anchor.y * Sprites[spriteID].height)) + (Sprites[spriteID].height / 2)
}
function getTopY(spriteID) {
	if (spriteID == undefined) {
		return me.y - (me.anchor.y * me.height)
	}
	return Sprites[spriteID].y - (Sprites[spriteID].anchor.y * Sprites[spriteID].height)
}
function getBottomY(spriteID) {
	if (spriteID == undefined) {
		return (me.y - (me.anchor.y * me.height)) + me.height
	}
	return (Sprites[spriteID].y - (Sprites[spriteID].anchor.y * Sprites[spriteID].height)) + Sprites[spriteID].height
}

function sortOb(ob, convertToArrays, dir) { // Based off https://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
    var arr = []
    var i = 0
    for (i in ob) {
        arr[arr.length] = [i, ob[i]]
    }
	if (dir == "highestFirst") {
		arr.sort(function(a, b) {
	        return a[1] + b[1]
	    })
	}
	else {
		arr.sort(function(a, b) {
	        return a[1] - b[1]
	    })
	}

	if (convertToArrays) {
		var newArr = [[], []]
	    var i = 0
	    for (i in arr) {
	        newArr[0][i] = arr[i][1]
			newArr[1][i] = arr[i][0]
	    }
	    return newArr
	}
	else {
		var newOb = {}
	    var i = 0
	    for (i in arr) {
	        newOb[arr[i][0]] = arr[i][1]
			console.log(arr[i][0])
	    }
	    return newOb
	}
}


function assignIdForClone(sprite) {
	var i = 0
	for (i in spriteCloneIds[sprite]) {
		if (spriteCloneIds[sprite][i] == undefined) {
			return i
		}
	}
	return spriteCloneIds[sprite].length
}

function clone(x, y, imgId, data, text, settings, width, height, fixedToCamera, bitmapID) {
	return cloneSprite(x, y, imgId, myJSON.id, data, text, settings, width, height, fixedToCamera, bitmapID)
}

function cloneSprite(x, y, imgId, sprite, data, text, settings, width, height, fixedToCamera, bitmapID) {
	cloneCount++

	var id = assignIdForClone(sprite)
	var meWas = me
	var myIDWas = myID

	internal.createSprite({
		"x": x,
		"y": y,
		"cos": imgId,
		"bitmapID": imgId,
		"type": Assets.sprites[Sprites[sprite].JSONID].type,
		"text": text,
		"settings": settings,
		"width": width,
		"height": height,
		"fixedToCamera": fixedToCamera,
		"bitmapID": bitmapID
	})
	me.vars = {}
	me.cloneID = id
	me.cloneOf = sprite
	dataForClone = data

	var response = null
	if (functionForClone != undefined) {
		if (functionForClone[1] == "before") {
			var response = functionForClone[0]()
			functionForClone = null
		}
	}

	spriteCloneIds[sprite][id] = sprite + "#" + id
	Sprites[sprite + "#" + id] = me
	var cloneScripts = Assets["sprites"][SpritesIndex[sprite]]["clonescripts"]

	if (cloneScripts !== undefined) {
		if (cloneScripts["init"].length > 0) {
			var i = 0
			for (i in cloneScripts["init"]) {
				myID = id
				cloneScripts["init"][i]()
			}
		}
	}

	if (functionForClone != undefined) {
		if (functionForClone[1] == "after") {
			var response = functionForClone[0]()
			functionForClone = null
		}
	}

	me = meWas
	myID = myIDWas
	return response
}

function getDir(x, y) {
	var deltaX = x - me.x // From https://stackoverflow.com/questions/15994194/how-to-convert-x-y-coordinates-to-an-angle
	var deltaY = y - me.y
	var rad = Math.atan2(deltaY, deltaX) // In radians
	var deg = rad * (180 / Math.PI)
	return deg + 180
}

function glideTo(x, y, glide) {
	if (me.fixedToCamera) {
		var xdif = x - me.cameraOffset.x
		var ydif = y - me.cameraOffset.y
		me.cameraOffset.x = me.cameraOffset.x + (xdif / glide)
		me.cameraOffset.y = me.cameraOffset.y + (ydif / glide)
	}
	else {
		var xdif = x - me.x
		var ydif = y - me.y
		me.x = me.x + (xdif / glide)
		me.y = me.y + (ydif / glide)
	}
}

function deleteClone(id, spriteID) {
	if (id === undefined) {
		var ID = myID
	}
	else {
		var ID = id
	}
	if (spriteID === undefined) {
		var SID = myJSON.id
	}
	else {
		var SID = spriteID
	}

	if (Sprites[spriteCloneIds[SID][ID]] !== undefined) {
		cloneCount--

		Sprites[spriteCloneIds[SID][ID]].destroy()
		spriteCloneIds[SID][ID] = undefined
	}
}

function enableTouching() {
	Game.physics.enable(me, Phaser.Physics.ARCADE)
	me.body.sensor = true
	me.body.immovable = true
}

function jumpInFrontOfSprite(sprite) {
	me.sendToBack()
	var i = 0
	while (i < Sprites[sprite].z + 1) {
		me.moveUp()
		i++
	}
}

function touchingSprite(sprite, criteria, expand, md) {
	if (me.body == null || Sprites[sprite].body == null) {
		return false // It won't work if collision hasn't been enabled.
	}
	//var mode = ""
	if (md == undefined) {
		var mode = "touch"
	}
	else {
		var mode = md
	}

	var revert = function() {
		me.x = me.body.x + (me.anchor.x * me.width)
		me.y = me.body.y + (me.anchor.y * me.height)
		Sprites[sprite].x = Sprites[sprite].body.x + (Sprites[sprite].anchor.x * Sprites[sprite].width)
		Sprites[sprite].y = Sprites[sprite].body.y + (Sprites[sprite].anchor.y * Sprites[sprite].height)

		me.body.setSize(dimensions[0][0], dimensions[0][1], dimensions[0][2], dimensions[0][3])
		Sprites[sprite].body.setSize(dimensions[1][0], dimensions[1][1], dimensions[1][2], dimensions[1][3])

		me.body.x = dimensions[0][6]
		me.body.y = dimensions[0][7]
		Sprites[sprite].body.x = dimensions[1][6]
		Sprites[sprite].body.y = dimensions[1][7]
	}

	if (expand || mode == "touch") {
		// Save these so we can revert back to them later...
		var dimensions = [
			[
				me.body.sourceWidth,
				me.body.sourceHeight,
				me.body.offset.x,
				me.body.offset.y,
				me.x,
				me.y,
				me.body.x,
				me.body.y,
				getLeftX(),
				getTopY()
			],
			[
				Sprites[sprite].body.sourceWidth,
				Sprites[sprite].body.sourceHeight,
				Sprites[sprite].body.offset.x,
				Sprites[sprite].body.offset.y,
				Sprites[sprite].x,
				Sprites[sprite].y,
				Sprites[sprite].body.x,
				Sprites[sprite].body.y,
				getLeftX(sprite),
				getTopY(sprite)
			]
		]
		// So that we can update the body position...
		me.x = 0
		me.y = 0
		Sprites[sprite].x = 0
		Sprites[sprite].y = 0

		// Update the body position...
		me.body.x = dimensions[0][8]
		me.body.y = dimensions[0][9]
		Sprites[sprite].body.x = dimensions[1][8]
		Sprites[sprite].body.y = dimensions[1][9]


		// Change the hitbox size based on inputs...
		var size = Math.max(me.body.sourceWidth, me.body.sourceHeight)
		if (mode == "touch") {
			if (expand) {
				me.body.setSize(size + 2, size + 2, me.body.offset.x - 1, me.body.offset.y - 1)
			}
			else {
				me.body.setSize(me.body.sourceWidth + 2, me.body.sourceHeight + 2, me.body.offset.x - 1, me.body.offset.y - 1)
			}
		}
		else {
			if (expand) {
				me.body.setSize(size, size)
			}
		}
		var size = Math.max(Sprites[sprite].body.sourceWidth, Sprites[sprite].body.sourceHeight)
		if (mode == "touch") {
			if (expand) {
				Sprites[sprite].body.setSize(size + 2, size + 2, Sprites[sprite].body.offset.x - 1, Sprites[sprite].body.offset.y - 1)
			}
			else {
				Sprites[sprite].body.setSize(Sprites[sprite].body.sourceWidth + 2, Sprites[sprite].body.sourceHeight + 2, Sprites[sprite].body.offset.x - 1, Sprites[sprite].body.offset.y - 1)
			}
		}
		else {
			if (expand) {
				Sprites[sprite].body.setSize(size, size)
			}
		}
	}
	if (criteria != undefined) {
		var ret = Game.physics.arcade.overlap(Sprites[sprite], me, null, null, Game)
		if (ret) {
			if (criteria(Sprites[sprite])) {
				revert() // Return the hitbox back to it's normal size.
				return true
			}
		}
		revert() // Return the hitbox back to it's normal size.
		return false
	}
	else {
		var ret = Game.physics.arcade.overlap(Sprites[sprite], me, null, null, Game)
		revert() // Return the hitbox back to it's normal size.
		return ret
	}
}

function touchingClones(sprite, criteria, expand, mode) {
	var i = 0
	touchInfo = ""
	for (i in spriteCloneIds[sprite]) {
		if (spriteCloneIds[sprite][i] != undefined) {
			if (Sprites[spriteCloneIds[sprite][i]] != undefined) {
				if (sprite != me.cloneOf | i != me.cloneID) {
					if (touchingSprite(spriteCloneIds[sprite][i], criteria, expand, mode)) {
						touchInfo = spriteCloneIds[sprite][i]
						return true
					}
				}
			}
		}
	}
	return false
}

function deleteAllClonesOfSprite(spriteID) {
	if (spriteID === undefined) {
		var SID = myJSON.id
	}
	else {
		var SID = spriteID
	}

	var i = 0
	for (i in spriteCloneIds[SID]) {
		if (spriteCloneIds[SID][i] !== undefined) {
			Sprites[spriteCloneIds[SID][i]].destroy()
		}
	}
	spriteCloneIds[SID] = []
}

function reset() {
	var i = 0
	for (i in mainResetScriptTimes[state.toString()]) {
		var c = mainResetScriptTimes[state.toString()][i]
		var c = Assets["scripts"]["init"][c]
		c["code"]()
	}

	var i = 0
	for (i in Assets["sprites"]) {
		var c = Sprites[Assets["sprites"][i].id]
		c.visible = false
		deleteAllClonesOfSprite(Assets["sprites"][i].id)
	}

	var i = 0
	for (i in resetScriptTimes[state.toString()]) {
		var c = resetScriptTimes[state.toString()][i]
		me = Sprites[Assets["sprites"][c[0]]["id"]]
		myJSON = Assets["sprites"][c[0]]
		spriteId = Assets["sprites"][c[0]]
		var c = Assets["sprites"][c[0]]["scripts"]["init"][c[1]]
		me.visible = true
		if (! (c["code"] === null || c["code"] === undefined)) {
			c["code"]()
		}
	}
}

var internal = {}


internal.createSprite = function(ob) {
	if (ob["type"] == "sprite" || ob["type"] == undefined) {
		me = Game.add.sprite(ob["x"], ob["y"], ob["cos"])
		me.id = ob.id
		spriteCloneIds[ob["id"]] = []
	}
	else {
		if (ob["type"] == "text") {
			if ("settings" in ob) {
				me = Game.add.text(ob["x"], ob["y"], ob["text"], ob["settings"])
			}
			else {
				me = Game.add.text(ob["x"], ob["y"], ob["text"], {})
			}
			me.smoothed = true
			spriteCloneIds[ob["id"]] = []
		}
		else {
			if (ob["type"] == "canvas") { // Help from https://stackoverflow.com/questions/46695098/how-can-i-fix-bitmapdata-to-the-camera-in-phaser/46696512#46696512
				me = Game.add.bitmapData(ob["width"], ob["height"])
				spriteCloneIds[ob["id"]] = []
			}
			else {
				if (ob["type"] == "canvasFrame") { // Help from https://stackoverflow.com/questions/46695098/how-can-i-fix-bitmapdata-to-the-camera-in-phaser/46696512#46696512
					me = Game.add.sprite(ob["x"], ob["y"], Sprites[ob["bitmapID"]])
					if (ob["fixedToCamera"]) {
						me.fixedToCamera = true
					}
					spriteCloneIds[ob["id"]] = []
				}
			}
		}
	}
}

function create() {
	Game.physics.startSystem(Phaser.Physics.ARCADE)
	Game.input.addMoveCallback(function(){}, this)

	var i = 0
	for (i in Assets["sprites"]) {
		var i = JSON.parse(i)
		var c = Assets["sprites"][i]
		SpritesIndex[c["id"]] = i
		myJSON = c

		internal.createSprite(myJSON)
		me.JSONID = i

		me.vars = {}
		if (c["scripts"] != undefined) {
			if (! (c["scripts"]["main"] === undefined || c["scripts"]["main"] === null)) {
				if (c["scripts"]["main"].length > 0) {
					var a = 0
					for (a in c["scripts"]["main"]) {
						if (scriptTimes[c["scripts"]["main"][a]["stateToRun"].toString()] === undefined) {
							scriptTimes[c["scripts"]["main"][a]["stateToRun"].toString()] = []
						}
						scriptTimes[c["scripts"]["main"][a]["stateToRun"].toString()][scriptTimes[c["scripts"]["main"][a]["stateToRun"].toString()].length] = [i, a]
					}
				}
			}
			if (! (c["scripts"]["init"] === undefined || c["scripts"]["init"] === null)) {
				if (c["scripts"]["init"].length > 0) {
					var a = 0
					for (a in c["scripts"]["init"]) {
						if (resetScriptTimes[c["scripts"]["init"][a]["stateToRun"].toString()] === undefined) {
							resetScriptTimes[c["scripts"]["init"][a]["stateToRun"].toString()] = []
						}
						resetScriptTimes[c["scripts"]["init"][a]["stateToRun"].toString()][resetScriptTimes[c["scripts"]["init"][a]["stateToRun"].toString()].length] = [i, a]
					}
				}
			}
		}

		if (c["clonescripts"] !== undefined) {
			if (! (c["clonescripts"]["main"] === undefined || c["clonescripts"]["main"] === null)) {
				if (c["clonescripts"]["main"].length > 0) {
					var a = 0
					for (a in c["clonescripts"]["main"]) {
						if (cloneMainScripts[c["id"]] === undefined) {
							cloneMainScripts[c["id"]] = []
						}
						cloneMainScripts[c["id"]][cloneMainScripts[c["id"]].length] = c["clonescripts"]["main"][a]
					}
				}
			}
			if (! (c["clonescripts"]["init"] === undefined || c["clonescripts"]["init"] === null)) {
				if (c["clonescripts"]["init"].length > 0) {
					var a = 0
					for (a in c["clonescripts"]["init"]) {
						if (cloneResetScripts[c["id"]] === undefined) {
							cloneResetScripts[c["id"]] = []
						}
						cloneResetScripts[c["id"]][cloneResetScripts[c["id"]].length] = c["clonescripts"]["init"][a]
					}
				}
			}
		}

		Sprites[c["id"]] = me
	}


	var i = 0
	for (i in Assets["scripts"]["main"]) {
		var c = Assets["scripts"]["main"][i]
		if (mainScriptTimes[c["stateToRun"][1]][c["stateToRun"][0].toString()] === undefined) {
			mainScriptTimes[c["stateToRun"][1]][c["stateToRun"][0].toString()] = []
		}
		mainScriptTimes[c["stateToRun"][1]][c["stateToRun"][0].toString()][mainScriptTimes[c["stateToRun"][1]][c["stateToRun"][0]].length] = i
	}

	var i = 0
	for (i in Assets["scripts"]["init"]) {
		var c = Assets["scripts"]["init"][i]
		if (mainResetScriptTimes[c["stateToRun"].toString()] === undefined) {
			mainResetScriptTimes[c["stateToRun"].toString()] = []
		}
		mainResetScriptTimes[c["stateToRun"].toString()][mainResetScriptTimes[c["stateToRun"].toString()].length] = i
	}

	reset()

	if (Assets["initScript"] != undefined) {
		Assets["initScript"]()
	}

	console.log("\n")

	if (errors == 0) {
		console.log("JAMESCRIPT has been initialised sucessfully.")
	}
	else {
		console.log("JAMESCRIPT hit an error.")
	}
}

function main(loop) {
	inX = Game.input.x
	inY = Game.input.y

	if (state != stateWas) {
		reset()
		stateWas = state
	}

	var i = 0
	for (i in mainScriptTimes["before"][state.toString()]) {
		var c = mainScriptTimes["before"][state.toString()][i]
		var c = Assets["scripts"]["main"][c]
		c["code"]()
	}

	var cloneScriptsRun = []
	var i = 0
	for (i in scriptTimes[state.toString()]) {
		var c = scriptTimes[state.toString()][i]
		me = Sprites[Assets["sprites"][c[0]]["id"]]
		myJSON = Assets["sprites"][c[0]]
		var c = Assets["sprites"][c[0]]["scripts"]["main"][c[1]]
		myID = -1
		spriteId = Assets["sprites"][c[0]]
		if (! (c["code"] === null || c["code"] === undefined)) {
			c["code"]()
		}

		var a = 0
		for (a in spriteCloneIds[myJSON.id]) {
			if (Sprites[spriteCloneIds[myJSON.id][a]] !== undefined) {
				me = Sprites[spriteCloneIds[myJSON.id][a]]
				myID = me.cloneID
				var b = 0
				for (b in cloneMainScripts[myJSON.id]) {
					cloneMainScripts[myJSON.id][b]()
				}
			}
		}
	}

	var i = 0
	for (i in mainScriptTimes["after"][state.toString()]) {
		var c = mainScriptTimes["after"][state.toString()][i]
		var c = Assets["scripts"]["main"][c]
		c["code"]()
	}

	if (currentFade["speed"] !== 0) {
		if (currentFade["tick"] >= (100 / currentFade["speed"]) + currentFade["stopTime"]) {
			fadeDot.alpha = 1 - (((currentFade["tick"] - currentFade["stopTime"] - (100 / currentFade["speed"])) * currentFade["speed"]) / 100)
			if (fadeDot.alpha == 0) {
				currentFade["speed"] = 0
				fadeDot.visible = false
			}
			else {
				if (fadeDot.alpha == 1) {
					state = currentFade["newState"]
				}
			}
		}
		else {
			if (currentFade["tick"] >= 100 / currentFade["speed"]) {
				fadeDot.alpha = 1
			}
			else {
				fadeDot.alpha = (currentFade["tick"] * currentFade["speed"]) / 100
			}
		}
		currentFade["tick"]++
		fadeDot.bringToTop()
	}

	currentFPS = fpsCalc.getFPS()

	if (Assets["mainScript"] != undefined) {
		Assets["mainScript"]()
	}

	if (doubleScripts && (! loop)) {
		main(true)
	}
}

// Accurate colision detection

collision = {
	"canvas": document.createElement("canvas"),
	"ctx": null,
	"scan": function(image, id) {
		var canvas = document.createElement("canvas")
		var ctx = canvas.getContext("2d")

		var texture = image

		canvas.width = texture.width
		canvas.height = texture.height

		ctx.drawImage(texture, 0, 0)

		var data = ctx.getImageData(0, 0, canvas.width, canvas.height)

		var i = 0
		while (i < data.data.length) {
			data.data[i] = 0
			data.data[i + 1] = 0
			data.data[i + 2] = 0
			if (data.data[i + 3] != 0) {
				data.data[i + 3] = 255
				data.data[i] = 255
			}
			else {
				data.data[i + 3] = 0
			}
			var i = i + 4
		}
		ctx.putImageData(data, 0, 0)
		colision.scans[id] = canvas
	},
	"scans": {},
	"lastColision": {
		"time": 0
	},
	"touchingSprite": function(sprite, criteria, res, md) {
		if (md == undefined) {
			var mode = "touch"
		}
		else {
			var mode = md
		}
		if (res == undefined) {
			var resolution = 1
		}
		else {
			var resolution = res
		}
		var spr = Sprites[sprite]

		var start = new Date()

		if (colision.scans[me.key] == null || colision.scans[spr.key] == null) {
			var unscanned = []
			if (colision.scans[me.key] == null) {
				unscanned[unscanned.length] = me.key
			}
			if (colision.scans[spr.key] == null) {
				unscanned[unscanned.length] = spr.key
			}
			if (unscanned.length == 1) {
				throw new Error("JAMESCRIPT: Pixel perfect colision detection has failed. " + unscanned[0] + " has not been scanned. Add the property 'scan' when you load it if you want it scanned.")
			}
			else {
				throw new Error("JAMESCRIPT: Pixel perfect colision detection has failed. " + unscanned.join(" and ") + " have not been scanned. Add the property 'scan' when you load them if you want them scanned.")
			}

		}

		if (touchingSprite(sprite, criteria, true, mode)) {
			var myscan = colision.scans[me.key]
			var otherscan = colision.scans[me.key]
			var ctx = colision.ctx
			var canvas = colision.canvas

			var scaleX = function(x, resolution) {
				return (x / Game.width) * (Game.width / resolution)
			}
			var scaleY = function(y, resolution) {
				return (y / Game.height) * (Game.height / resolution)
			}


			var colisionInfo = []
			if (mode == "touch") {
				var x = scaleX((me.x - (me.width * me.anchor.x)) + (me.width / 2), resolution) - 1 // Get its centred x)
				var y = scaleY((me.y - (me.height * me.anchor.y)) + (me.height / 2), resolution) - 1 // Get its centred x
				var width = scaleX(me.width, resolution) + 2
				var height = scaleY(me.height, resolution) + 2
			}
			else {
				var x = scaleX((me.x - (me.width * me.anchor.x)) + (me.width / 2), resolution) // Get its centred x)
				var y = scaleY((me.y - (me.height * me.anchor.y)) + (me.height / 2), resolution) // Get its centred x
				var width = scaleX(me.width, resolution)
				var height = scaleY(me.height, resolution)
			}

			colisionInfo[0] = [x, y, width, height]
			if (mode == "touch") {
				var x = scaleX((spr.x - (spr.width * spr.anchor.x)) + (spr.width / 2), resolution) - 1 // Get its centred x
				var y = scaleY((spr.y - (spr.height * spr.anchor.y)) + (spr.height / 2), resolution) - 1 // Get its centred y
				var width = scaleX(spr.width, resolution) + 2
				var height = scaleY(spr.height, resolution) + 2
			}
			else {
				var x = scaleX((spr.x - (spr.width * spr.anchor.x)) + (spr.width / 2), resolution) // Get its centred x
				var y = scaleY((spr.y - (spr.height * spr.anchor.y)) + (spr.height / 2), resolution) // Get its centred y
				var width = scaleX(spr.width, resolution)
				var height = scaleY(spr.height, resolution)
			}
			colisionInfo[1] = [x, y, width, height]

			var widthNeeded = Math.max(colisionInfo[0][0] + (colisionInfo[0][2] / 2), colisionInfo[1][0] + (colisionInfo[1][2] / 2))
			var heightNeeded = Math.max(colisionInfo[0][1], colisionInfo[1][1]) + (Math.max(colisionInfo[0][3], colisionInfo[1][3]) / 2)
			var cropX = Math.max(colisionInfo[0][0] - (colisionInfo[0][2] / 2), colisionInfo[1][0] - (colisionInfo[1][2] / 2))
			var cropY = Math.max(colisionInfo[0][1] - (colisionInfo[0][3] / 2), colisionInfo[1][1] - (colisionInfo[1][3] / 2))
			colisionInfo[0][0] = colisionInfo[0][0] - cropX
			colisionInfo[0][1] = colisionInfo[0][1] - cropY
			colisionInfo[1][0] = colisionInfo[1][0] - cropX
			colisionInfo[1][1] = colisionInfo[1][1] - cropY




			canvas.width = widthNeeded - cropX
			canvas.height = heightNeeded - cropY
			ctx.clearRect(0, 0, canvas.width, canvas.height)


			// Draw the two images

			// https://stackoverflow.com/questions/3793397/html5-canvas-drawimage-with-at-an-angle
			var x = colisionInfo[0][0]
			var y = colisionInfo[0][1]
			var width = colisionInfo[0][2]
			var height = colisionInfo[0][3]
			var angleInRadians = Game.math.degToRad(me.rotation)

			ctx.globalAlpha = 0.5

			if (me.rotation != 0) {
				ctx.save()
				ctx.translate(x, y)
				ctx.rotate(angleInRadians)
				ctx.drawImage(colision.scans[me.key], -width / 2, -height / 2, width, height)
				ctx.rotate(-angleInRadians)
				ctx.translate(-x, -y)
				ctx.restore()
			}
			else {
				ctx.drawImage(colision.scans[me.key], x - (width / 2), y - (height / 2), width, height)
			}

			// Draw the other image...

			var x = colisionInfo[1][0]
			var y = colisionInfo[1][1]
			var width = colisionInfo[1][2]
			var height = colisionInfo[1][3]
			var angleInRadians = Game.math.degToRad(spr.rotation)

			ctx.globalAlpha = 0.5

			if (spr.rotation != 0) {
				ctx.save()
				ctx.translate(x, y)
				ctx.rotate(angleInRadians)
				ctx.drawImage(colision.scans[spr.key], -width / 2, -height / 2, width, height)
				ctx.rotate(-angleInRadians)
				ctx.translate(-x, -y)
				ctx.restore()
			}
			else {
				ctx.drawImage(colision.scans[spr.key], x - (width / 2), y - (height / 2), width, height)
			}

			var data = ctx.getImageData(0, 0, canvas.width, canvas.height)

			var i = 3
			while (i < data.data.length) {
				if (data.data[i] == 192) {
					colision.lastColision.time = (new Date() - start) / 1000
					return true
				}
				i = i + 4
			}
		}

		colision.lastColision.time = (new Date() - start) / 1000
		return false
	},
	"touchingClones": function(sprite, criteria, res, mode) {
		var i = 0
		colision.touchInfo = ""
		for (i in spriteCloneIds[sprite]) {
			if (spriteCloneIds[sprite][i] != undefined) {
				if (Sprites[spriteCloneIds[sprite][i]] != undefined) {
					if (sprite != me.cloneOf | i != me.cloneID) {
						if (colision.touchingSprite(spriteCloneIds[sprite][i], criteria, res, mode)) {
							touchInfo = spriteCloneIds[sprite][i]
							return true
						}
					}
				}
			}
		}
		return false
	},
	"touchInfo": null
}
collision.ctx = collision.canvas.getContext("2d")
collision.ctx.imageSmoothingEnabled = false
