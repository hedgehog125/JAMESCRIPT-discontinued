// Under creative commons licence see: https://creativecommons.org/
// Github repo: https://github.com/hedgehog125/JAMESCRIPT

// Just the collision detection!!! <======


// UPDATE FROM THE JAMESCRIPT USED FOR THE COLISION THING!!!!!!!!!!! <===================

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
		collision.scans[id] = canvas
	},
	"scans": {},
	"lastcollision": {
		"time": 0
	},
	"intersection": function(AABBs) {
		// Mostly from https://stackoverflow.com/questions/19753134/get-the-points-of-intersection-from-2-rectangles
		var x = Math.max(AABBs[0][0], AABBs[1][0])
		var y = Math.max(AABBs[0][1], AABBs[1][1])
		if (AABBs[0][0] + AABBs[0][2] < AABBs[1][0] + AABBs[1][2]) {
			var width = (AABBs[0][0] + AABBs[0][2]) - x
		}
		else {
			var width = (AABBs[0][1] + AABBs[1][2]) - x
		}
		if (AABBs[0][1] + AABBs[0][3] < AABBs[1][1] + AABBs[1][3]) {
			var height = (AABBs[0][2] + AABBs[0][3]) - y
		}
		else {
			var height = (AABBs[1][2] + AABBs[1][3]) - y
		}
		return [x, y, width, height]
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

		if (collision.scans[me.key] == null || collision.scans[spr.key] == null) {
			var unscanned = []
			if (collision.scans[me.key] == null) {
				unscanned[unscanned.length] = me.key
			}
			if (collision.scans[spr.key] == null) {
				unscanned[unscanned.length] = spr.key
			}
			if (unscanned.length == 1) {
				throw new Error("JAMESCRIPT: Pixel perfect collision detection has failed. " + unscanned[0] + " has not been scanned. Add the property 'scan' when you load it if you want it scanned.")
			}
			else {
				throw new Error("JAMESCRIPT: Pixel perfect collision detection has failed. " + unscanned.join(" and ") + " have not been scanned. Add the property 'scan' when you load them if you want them scanned.")
			}

		}

		if (touchingSprite(sprite, criteria, true, mode)) {
			var myscan = collision.scans[me.key]
			var otherscan = collision.scans[me.key]
			var ctx = collision.ctx
			var canvas = collision.canvas

			var scaleX = function(x, resolution) {
				return (x / Game.width) * (Game.width / resolution)
			}
			var scaleY = function(y, resolution) {
				return (y / Game.height) * (Game.height / resolution)
			}


			var collisionInfo = []
			if (mode == "touch") {
				var x = scaleX(getRightX(), resolution) - 1 // Get its centred x)
				var y = scaleY(getBottomY(), resolution) - 1 // Get its centred x
				var width = scaleX(me.width, resolution) + 2
				var height = scaleY(me.height, resolution) + 2
			}
			else {
				var x = scaleX(getRightX(), resolution) // Get its centred x)
				var y = scaleY(getBottomY(), resolution) // Get its centred x
				var width = scaleX(me.width, resolution)
				var height = scaleY(me.height, resolution)
			}

			collisionInfo[0] = [x, y, width, height]

			if (mode == "touch") {
				var x = scaleX(getRightX(sprite), resolution) - 1 // Get its centred x
				var y = scaleY(getBottomY(sprite), resolution) - 1 // Get its centred y
				var width = scaleX(spr.width, resolution) + 2
				var height = scaleY(spr.height, resolution) + 2
			}
			else {
				var x = scaleX(getRightX(sprite), resolution) // Get its centred x
				var y = scaleY(getBottomY(sprite), resolution) // Get its centred y
				var width = scaleX(spr.width, resolution)
				var height = scaleY(spr.height, resolution)
			}
			collisionInfo[1] = [x, y, width, height]


			var AABBs = [[collisionInfo[0][0], collisionInfo[0][1], collisionInfo[0][2], collisionInfo[0][3]], [collisionInfo[1][0], collisionInfo[1][1], collisionInfo[1][2], collisionInfo[1][3]]]
			var overlap = collision.intersection(AABBs)

			// Crop the canvas...

			var widthNeeded = Math.max(collisionInfo[0][0] + (collisionInfo[0][2] / 2), collisionInfo[1][0] + (collisionInfo[1][2] / 2))
			var heightNeeded = Math.max(collisionInfo[0][1], collisionInfo[1][1]) + (Math.max(collisionInfo[0][3], collisionInfo[1][3]) / 2)
			var cropX = Math.max(collisionInfo[0][0] - (collisionInfo[0][2] / 2), collisionInfo[1][0] - (collisionInfo[1][2] / 2))
			var cropY = Math.max(collisionInfo[0][1] - (collisionInfo[0][3] / 2), collisionInfo[1][1] - (collisionInfo[1][3] / 2))
			collisionInfo[0][0] = collisionInfo[0][0] - cropX
			collisionInfo[0][1] = collisionInfo[0][1] - cropY
			collisionInfo[1][0] = collisionInfo[1][0] - cropX
			collisionInfo[1][1] = collisionInfo[1][1] - cropY


			canvas.width = widthNeeded - cropX
			canvas.height = heightNeeded - cropY
			ctx.clearRect(0, 0, canvas.width, canvas.height)

			if (canvas.width < 1 || canvas.height < 1) {
				return false // Otherwise there will be an error
			}


			// Draw the two images

			// https://stackoverflow.com/questions/3793397/html5-canvas-drawimage-with-at-an-angle
			var x = collisionInfo[0][0]
			var y = collisionInfo[0][1]
			var width = collisionInfo[0][2]
			var height = collisionInfo[0][3]
			var angleInRadians = Game.math.degToRad(me.rotation)

			ctx.globalAlpha = 0.5

			if (me.rotation != 0) {
				ctx.save()
				ctx.translate(x, y)
				ctx.rotate(angleInRadians)
				ctx.drawImage(collision.scans[me.key], -width / 2, -height / 2, width, height)
				ctx.rotate(-angleInRadians)
				ctx.translate(-x, -y)
				ctx.restore()
			}
			else {
				ctx.drawImage(collision.scans[me.key], x - (width / 2), y - (height / 2), width, height)
			}

			// Draw the other image...

			var x = collisionInfo[1][0]
			var y = collisionInfo[1][1]
			var width = collisionInfo[1][2]
			var height = collisionInfo[1][3]
			var angleInRadians = Game.math.degToRad(spr.rotation)

			ctx.globalAlpha = 0.5

			if (spr.rotation != 0) {
				ctx.save()
				ctx.translate(x, y)
				ctx.rotate(angleInRadians)
				ctx.drawImage(collision.scans[spr.key], -width / 2, -height / 2, width, height)
				ctx.rotate(-angleInRadians)
				ctx.translate(-x, -y)
				ctx.restore()
			}
			else {
				ctx.drawImage(collision.scans[spr.key], x - (width / 2), y - (height / 2), width, height)
			}

			if (overlap[2] < 1 || overlap[3] < 1) { // Make sure the width and height aren't too small
				return false
			}
			var data = ctx.getImageData(overlap[0], overlap[1], overlap[2], overlap[3]) // Only check the overlap.

			var i = 3
			while (i < data.data.length) {
				if (data.data[i] == 192) {
					collision.lastcollision.time = (new Date() - start) / 1000
					return true
				}
				i = i + 4
			}
		}

		collision.lastcollision.time = (new Date() - start) / 1000
		return false
	},
	"touchingClones": function(sprite, criteria, res, mode) {
		var i = 0
		collision.touchInfo = ""
		for (i in spriteCloneIds[sprite]) {
			if (spriteCloneIds[sprite][i] != undefined) {
				if (Sprites[spriteCloneIds[sprite][i]] != undefined) {
					if (sprite != me.cloneOf | i != me.cloneID) {
						if (collision.touchingSprite(spriteCloneIds[sprite][i], criteria, res, mode)) {
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
