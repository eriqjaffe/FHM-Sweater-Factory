const { app, BrowserWindow, dialog, Menu, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs');
const Jimp = require('jimp');
const { distortUnwrap } = require('@alxcube/lens')
require('@alxcube/lens-jimp');
/* const { createSVGWindow } = require('svgdom')
const window = createSVGWindow() */
const isMac = process.platform === 'darwin'
const os = require('os');
const tempDir = os.tmpdir()
const url = require('url');
const increment = require('add-filename-increment');
const Store = require("electron-store")
const fontname = require("fontname")
const chokidar = require('chokidar')
const versionCheck = require('github-version-checker');
const pkg = require('./package.json');

const store = new Store();

const userFontsFolder = path.join(app.getPath('userData'),"fonts")

if (!fs.existsSync(userFontsFolder)) {
    fs.mkdirSync(userFontsFolder);
}

if (!fs.existsSync(userFontsFolder+"/README.txt")) {
	var writeStream = fs.createWriteStream(userFontsFolder+"/README.txt");
	writeStream.write("TTF and OTF fonts dropped into this folder will automatically be imported into the Sweater Factory!\r\n\r\nFonts removed from this folder will still be available in the Sweater Factory until you quit the app, and they will not reload after that.  Of course, that may cause sweaters that you load into the app to misbehave.")
	writeStream.end()
}

const watcher = chokidar.watch(userFontsFolder, {
	ignored: /(^|[\/\\])\../, // ignore dotfiles
	persistent: true
});

watcher.on('ready', () => {})

const updateOptions = {
	repo: 'FHM-Sweater-Factory',
	owner: 'eriqjaffe',
	currentVersion: pkg.version
};

const fontArray = {
	"Acme": "Acme-Regular.ttf",
	"athletic_gothicregular": "athletic_gothic-webfont.ttf",
	"athletic_gothic_shadowregular": "athletic_gothic_shadow-webfont.ttf",
	"beaverton_scriptregular": "beaverton_script-webfont.ttf",
	"BerkshireSwash": "BerkshireSwash-Regular.ttf",
	"CantoraOne": "CantoraOne-Regular.ttf",
	"caxton_romanregular": "caxton_roman-webfont.ttf",
	"ChelaOne": "ChelaOne-Regular.ttf",
	"russell_circusregular": "circus-webfont.ttf",
	"Condiment": "Condiment-Regular.ttf",
	"Cookie": "Cookie-Regular.ttf",
	"Courgette": "Courgette-Regular.ttf",
	"CroissantOne": "CroissantOne-Regular.ttf",
	"Damion": "Damion-Regular.ttf",
	"Engagement": "Engagement-Regular.ttf",
	"rawlings_fancy_blockregular": "rawlingsfancyblock-regular-webfont.ttf",
	"GermaniaOne": "GermaniaOne-Regular.ttf",
	"Graduate": "Graduate-Regular.ttf",
	"GrandHotel": "GrandHotel-Regular.ttf",
	"JockeyOne": "JockeyOne-Regular.ttf",
	"kansasregular": "tuscan-webfont.ttf",
	"KaushanScript": "KaushanScript-Regular.ttf",
	"LeckerliOne": "LeckerliOne-Regular.ttf",
	"LilyScriptOne": "LilyScriptOne-Regular.ttf",
	"Lobster": "Lobster-Regular.ttf",
	"LobsterTwo": "LobsterTwo-Regular.ttf",
	"MetalMania": "MetalMania-Regular.ttf",
	"Miniver": "Miniver-Regular.ttf",
	"Molle,italic": "Molle-Regular.ttf",
	"NewRocker": "NewRocker-Regular.ttf",
	"Norican": "Norican-Regular.ttf",
	"rawlings_old_englishmedium": "rawlingsoldenglish-webfont.ttf",
	"OleoScript": "OleoScript-Regular.ttf",
	"OleoScriptSwashCaps": "OleoScriptSwashCaps-Regular.ttf",
	"Pacifico": "Pacifico.ttf",
	"PirataOne": "PirataOne-Regular.ttf",
	"Playball": "Playball-Regular.ttf",
	"pro_full_blockregular": "pro_full_block-webfont.ttf",
	"richardson_fancy_blockregular": "richardson_fancy_block-webfont.ttf",
	"RubikOne": "RubikOne-Regular.ttf",
	"RumRaisin": "RumRaisin-Regular.ttf",
	"Satisfy": "Satisfy-Regular.ttf",
	"SeymourOne": "SeymourOne-Regular.ttf",
	"spl28scriptregular": "spl28script-webfont.ttf",
	"ua_tiffanyregular": "tiffany-webfont.ttf",
	"TradeWinds": "TradeWinds-Regular.ttf",
	"mlb_tuscan_newmedium": "mlb_tuscan_new-webfont.ttf",
	"UnifrakturCook": "UnifrakturCook-Bold.ttf",
	"UnifrakturMaguntia": "UnifrakturMaguntia-Book.ttf",
	"Vibur": "Vibur-Regular.ttf",
	"Viga": "Viga-Regular.ttf",
	"Wellfleet": "Wellfleet-Regular.ttf",
	"WendyOne": "WendyOne-Regular.ttf",
	"Yellowtail": "Yellowtail-Regular.ttf"
};

ipcMain.on('upload-image', (event, arg) => {
	let json = {}
	dialog.showOpenDialog(null, {
		properties: ['openFile'],
		filters: [
			{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }
		]
	  }).then(result => {
		  if(!result.canceled) {
			Jimp.read(result.filePaths[0], (err, image) => {
				if (err) {
					console.log(err);
				} else {
					image.getBase64(Jimp.AUTO, (err, ret) => {
						json.filename = path.basename(result.filePaths[0]),
						json.image = ret;
						json.path = result.filePaths[0]
						event.sender.send('upload-image-response', json)
						//res.end();
					})
				}
			});
		  }
	  }).catch(err => {
		console.log(err)
	  })
})

ipcMain.on('local-font', (event, arg) => {
	let json = {}
	const options = {
		defaultPath: store.get("uploadFontPath", app.getPath('desktop')),
		properties: ['openFile'],
		filters: [
			{ name: 'Fonts', extensions: ['ttf', 'otf'] }
		]
	}
	dialog.showOpenDialog(null, options).then(result => {
		if(!result.canceled) {
			store.set("uploadFontPath", path.dirname(result.filePaths[0]))
			const filePath = path.join(userFontsFolder,path.basename(result.filePaths[0]))
			try {
				const fontMeta = fontname.parse(fs.readFileSync(result.filePaths[0]))[0];
				var ext = getExtension(result.filePaths[0])
				var fontPath = url.pathToFileURL(result.filePaths[0])
				json.status = "ok"
				json.fontName = fontMeta.fullName
				json.fontStyle = fontMeta.fontSubfamily
				json.familyName = fontMeta.fontFamily
				json.fontFormat = ext
				json.fontMimetype = 'font/' + ext
				json.fontData = fontPath.href
				json.fontPath = filePath
				json.type = arg
				fs.copyFileSync(result.filePaths[0], filePath)
				event.sender.send('local-font-response', json)
			} catch (err) {
				json.status = "error"
				json.fontName = path.basename(result.filePaths[0])
				json.fontPath = result.filePaths[0]
				json.message = err
				event.sender.send('local-font-response', json)
				fs.unlinkSync(result.filePaths[0])
			}
		} else {
			json.status = "cancelled"
			event.sender.send('local-font-response', json)
			console.log("cancelled")
		}
	}).catch(err => {
		console.log(err)
		json.status = "error",
		json.message = err
		event.sender.send('local-font-response', json)
	})
})

ipcMain.on('local-font-folder', (event, arg) => {
	const jsonObj = {}
	const jsonArr = []

	filenames = fs.readdirSync(userFontsFolder);
	for (i=0; i<filenames.length; i++) {
        if (path.extname(filenames[i]).toLowerCase() == ".ttf" || path.extname(filenames[i]).toLowerCase() == ".otf") {
			const filePath = path.join(userFontsFolder,filenames[i])
			try {
				const fontMeta = fontname.parse(fs.readFileSync(filePath))[0];
				var ext = getExtension(filePath)
				var fontPath = url.pathToFileURL(filePath)
				var json = {
					"status": "ok",
					"fontName": fontMeta.fullName,
					"fontStyle": fontMeta.fontSubfamily,
					"familyName": fontMeta.fontFamily,
					"fontFormat": ext,
					"fontMimetype": 'font/' + ext,
					"fontData": fontPath.href,
					"fontPath": filePath,
				};
				jsonArr.push(json)
			} catch (err) {
				const json = {
					"status": "error",
					"fontName": path.basename(filePath),
					"fontPath": filePath,
					"message": err
				}
				jsonArr.push(json)
				//fs.unlinkSync(filePath)
			}
		}
	}
	jsonObj.result = "success"
	jsonObj.fonts = jsonArr
	event.sender.send('local-font-folder-response', jsonObj)
})

ipcMain.on('save-sweater', (event, arg) => {
	var buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');

	const options = {
		defaultPath: increment(store.get("downloadPath", app.getPath('downloads')) + '/' + arg.name+'.png',{fs: true})
	}

	dialog.showSaveDialog(null, options).then((result) => {
		if (!result.canceled) {
			Jimp.read(buffer, (err, fir_img) => {
			if(err) {
				event.sender.send('hide-overlay',null)
				console.log(err);
			} else {
				var watermark = fs.readFileSync(__dirname + "/images/fhm_watermark.png", {encoding: 'base64'});
				var buffer = Buffer.from(watermark, 'base64');
					Jimp.read(buffer, (err, sec_img) => {
						if(err) {
							console.log(err);
						} else {
							fir_img.composite(sec_img, 0, 0);
							fir_img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
								const finalImage = Buffer.from(buffer).toString('base64');
								fs.writeFile(result.filePath, finalImage, 'base64', function(err) {
									event.sender.send('hide-overlay',null)
									console.log(err);
								});		
							  });
						}
					})
				}
			});
			event.sender.send('hide-overlay',null)
		} else {
			event.sender.send('hide-overlay',null)
		}
	}).catch((err) => {
		event.sender.send('hide-overlay',null)
		console.log(err);
	});
})

ipcMain.on('check-for-update', (event, arg) => {
	checkForUpdate()
})

function checkForUpdate() {
	versionCheck(updateOptions, function (error, update) { // callback function
		if (error) {
			dialog.showMessageBox(null, {
				type: 'error',
				message: 'An error occurred checking for updates.'
			});	
		}
		if (update) { // print some update info if an update is available
			dialog.showMessageBox(null, {
				type: 'question',
				message: "Current version: "+pkg.version+"\r\n\r\nVersion "+update.name+" is now availble.  Click 'OK' to go to the releases page.",
				buttons: ['OK', 'Cancel'],
			}).then(result => {
				if (result.response === 0) {
					shell.openExternal(update.url)
				}
			})	
		} else {
			dialog.showMessageBox(null, {
				type: 'info',
				message: "Current version: "+pkg.version+"\r\n\r\nThere is no update available at this time."
			});	
		}
	});
}
 

ipcMain.on('remove-border', (event, arg) => {
	let imgdata = arg.imgdata
	let fuzz = parseInt(arg.fuzz)
	let pictureName = arg.pictureName
	let canvas = arg.canvas
	let imgLeft = arg.imgLeft
	let imgTop = arg.imgTop
	let path = arg.path
	let scaleX = arg.scaleX
	let scaleY = arg.scaleY
	let json = {}
	let buffer = Buffer.from(imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			try {
				image.autocrop()
				image.getBase64(Jimp.AUTO, (err, ret) => {
					json.status = 'success'
					json.data = ret
					json.canvas = canvas
					json.pTop = imgTop
					json.pLeft = imgLeft
					json.pictureName = pictureName
					json.path = path
					json.pScaleX = scaleX
					json.pScaleY = scaleY
					event.sender.send('imagemagick-response', json)
				})
			} catch (error) {
				son.status = 'error'
				json.message = error.message
				console.log(error)
				event.sender.send('imagemagick-response', json)
			}
		}
	})
})

ipcMain.on('replace-color', (event, arg) => {
	let imgdata = arg[0]
	let pLeft = arg[1]
	let pTop = arg[2]
	let pScaleX = arg[3]
	let pScaleY = arg[4]
	let pictureName = arg[9]
	let canvas = arg[10]
	let colorSquare = arg[13]
	let newColorSquare = arg[14]
	let json = {}
	var buffer = Buffer.from(imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	Jimp.read(buffer, (err, image) => {
		if (err) {
			json.status = 'error'
			json.message = err.message
			console.log(err)
			event.sender.send('imagemagick-response', json)
		}
		image.getBase64(Jimp.AUTO, (err, ret) => {
			if (err) {
				json.status = 'error'
				json.message = err.message
				console.log(err)
				event.sender.send('imagemagick-response', json)
			}
			json.status = "success"
			json.data = ret
			json.pTop = pTop
			json.pLeft = pLeft
			json.x = pScaleX
			json.y = pScaleY
			json.pictureName = pictureName
			json.canvas = canvas
			json.colorSquare = colorSquare
			json.newColorSquare = newColorSquare
			json.pScaleX = pScaleX
			json.pScaleY = pScaleY
			event.sender.send('imagemagick-response', json)
		})
	})
})

ipcMain.on('add-stroke', (event, arg) => {
	let imgdata = arg.imgdata
	let canvas = arg.canvas
	let left = arg.left
	let top = arg.top
	let scaleX = arg.scaleX
	let scaleY = arg.scaleY
	let path = arg.path
	let pictureName = arg.pictureName
	let buffer = Buffer.from(imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	let json = {}

	Jimp.read(buffer, (err, image) => {
		if (err) {
			json.status = 'error'
			json.message = err.message
			event.sender.send('imagemagick-response', json)
		} else {
			try {
				image.autocrop()
				image.getBase64(Jimp.AUTO, (err, ret) => {
					json.status = 'success'
					json.canvas = canvas
					json.data = ret
					json.pTop = top
					json.pLeft = left
					json.pictureName = pictureName
					json.path = path
					json.pScaleX = scaleX
					json.pScaleY = scaleY
					event.sender.send('imagemagick-response', json)
				})
			} catch (error) {
				json.status = 'error'
				json.message = error.message
				log.error(error);
				event.sender.send('imagemagick-response', json)
			}
		}
	})
})

ipcMain.on('warp-text', (event, arg) => {
	let buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	let amount = arg.amount * 4;
	let deform = arg.deform;
	let json = {}
	try {
		switch (deform) {
			case "arch":
				arch()
				async function arch() {
					try {
						let image = await Jimp.read(buffer);
						image.autocrop()
						const centeredImage = await new Jimp(1024, 1024, 0x00000000)
						const newImage = await new Jimp(1024, 1024);
						const x = (1024 - image.bitmap.width) / 2;
						const y = (1024 - image.bitmap.height) / 2;
						await centeredImage.blit(image, x, y);
						//await centeredImage.write(tempDir+"/temp_resized.png")
						centeredImage.scan(0, 0, centeredImage.bitmap.width, centeredImage.bitmap.height, function (x, y, idx) {
							const radians = x / centeredImage.bitmap.width * 360 * Math.PI / 180;
							const offsetY = (amount * -1) * Math.cos(radians);
							const newY = y + offsetY;
						
							const yFloor = Math.floor(newY);
							const yCeil = Math.ceil(newY);
							const yWeight = newY - yFloor;
						
							const clampedYFloor = Math.max(0, Math.min(centeredImage.bitmap.height - 1, yFloor));
							const clampedYCeil = Math.max(0, Math.min(centeredImage.bitmap.height - 1, yCeil));
						
							const colorFloor = Jimp.intToRGBA(centeredImage.getPixelColor(x, clampedYFloor));
							const colorCeil = Jimp.intToRGBA(centeredImage.getPixelColor(x, clampedYCeil));
						
							const r = colorFloor.r * (1 - yWeight) + colorCeil.r * yWeight;
							const g = colorFloor.g * (1 - yWeight) + colorCeil.g * yWeight;
							const b = colorFloor.b * (1 - yWeight) + colorCeil.b * yWeight;
							const a = colorFloor.a * (1 - yWeight) + colorCeil.a * yWeight;
						
							const interpolatedColor = Jimp.rgbaToInt(r, g, b, a);
							newImage.setPixelColor(interpolatedColor, x, y);
						});
						newImage.autocrop()
						let b64 = await newImage.getBase64Async(Jimp.AUTO)
						json.status = 'success'
						json.data = b64
						event.sender.send('warp-text-response', json)
					} catch (error) {
						console.error('Error applying wave effect:', error);
						return null;
					}
				}
				break;
			case "arc":
				arc()
				async function arc() {
					let image = await Jimp.read(buffer)
					image.autocrop()
					let result = await distortUnwrap(image, "Arc", [parseInt(amount/4)])
					let tempImg = await new Jimp(result.bitmap.width*4, result.bitmap.height*4)
					await tempImg.blit(result, 5, 5)
					await tempImg.autocrop()
					let b64 = await tempImg.getBase64Async(Jimp.AUTO)
					json.status = 'success'
					json.data = b64
					event.sender.send('warp-text-response', json)
				}
				break;
			case "bilinearUp":
				bilinearUp()
				async function bilinearUp() {
					let image = await Jimp.read(buffer)
					await image.autocrop()
					const y2=image.bitmap.height*((100-(amount/4))*0.01)
					const controlPoints = [1.5,0,0,0,0,0,image.bitmap.height,0,image.bitmap.height,image.bitmap.width,0,image.bitmap.width,0,image.bitmap.width,image.bitmap.height,image.bitmap.width,y2]
					const result = await distortUnwrap(image, "Polynomial", controlPoints)
					const tempImg = await new Jimp(result.bitmap.width*4, result.bitmap.height*4)
					await tempImg.blit(result, 5, 5)
					await tempImg.autocrop()
					let b64 = await tempImg.getBase64Async(Jimp.AUTO)
					json.status = 'success'
					json.data = b64
					event.sender.send('warp-text-response', json)
				}
				break;
			case "bilinearDown":
				bilinearDown()
				async function bilinearDown() {
					let image = await Jimp.read(buffer)
					await image.autocrop()
					const y2=image.bitmap.height*((100-(amount/4))*0.01)
					const controlPoints = [1.5,0,0,0,0,0,image.bitmap.height,0,y2,image.bitmap.width,0,image.bitmap.width,0,image.bitmap.width,image.bitmap.height,image.bitmap.width,image.bitmap.height]
					const result = await distortUnwrap(image, "Polynomial", controlPoints)
					const tempImg = await new Jimp(result.bitmap.width*4, result.bitmap.height*4)
					await tempImg.blit(result, 5, 5)
					await tempImg.autocrop()
					let b64 = await tempImg.getBase64Async(Jimp.AUTO)
					json.status = 'success'
					json.data = b64
					event.sender.send('warp-text-response', json)
				}
				break;
			case "archUp":
				archUp()
				async function archUp() {
					try {
						let image = await Jimp.read(buffer);
						const x = (1024 - image.bitmap.width) / 2;
						const y = (1024 - image.bitmap.height) / 2;
						const centeredImage = await new Jimp(1024, 1024, 0x00000000)
						await centeredImage.blit(image, x, y);
						const tempImage = new Jimp(image.bitmap.width * 2, image.bitmap.height)
						tempImage.blit(centeredImage, 0, 0, 0, 0, image.bitmap.width, image.bitmap.height);
						const newImage = new Jimp(image.bitmap.width, image.bitmap.height);
						tempImage.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
							const radians = (x * 180) / image.bitmap.width * Math.PI / 180;
							const offsetY = (amount * -1) * Math.cos(radians);
							const newY = y + offsetY;
						
							const yFloor = Math.floor(newY);
							const yCeil = Math.ceil(newY);
							const yWeight = newY - yFloor;
						
							const clampedYFloor = Math.max(0, Math.min(image.bitmap.height - 1, yFloor));
							const clampedYCeil = Math.max(0, Math.min(image.bitmap.height - 1, yCeil));
						
							const colorFloor = Jimp.intToRGBA(image.getPixelColor(x, clampedYFloor));
							const colorCeil = Jimp.intToRGBA(image.getPixelColor(x, clampedYCeil));
						
							const r = colorFloor.r * (1 - yWeight) + colorCeil.r * yWeight;
							const g = colorFloor.g * (1 - yWeight) + colorCeil.g * yWeight;
							const b = colorFloor.b * (1 - yWeight) + colorCeil.b * yWeight;
							const a = colorFloor.a * (1 - yWeight) + colorCeil.a * yWeight;
						
							const interpolatedColor = Jimp.rgbaToInt(r, g, b, a);
							newImage.setPixelColor(interpolatedColor, x, y);
						});
						
						newImage.autocrop();
						
						let b64 = await newImage.getBase64Async(Jimp.AUTO)
						json.status = 'success'
						json.data = b64
						event.sender.send('warp-text-response', json)
					} catch (error) {
						console.error('Error applying wave effect:', error);
						return null;
					}
				}
				break;
			case "archDown":
				archDown()
				async function archDown() {
					try {
						let image = await Jimp.read(buffer);
						const x = (1024 - image.bitmap.width) / 2;
						const y = (1024 - image.bitmap.height) / 2;
						const centeredImage = await new Jimp(1024, 1024, 0x00000000)
						await centeredImage.blit(image, x, y);
						const tempImage = new Jimp(image.bitmap.width * 2, image.bitmap.height)
						tempImage.blit(centeredImage, image.bitmap.width, 0, 0, 0, image.bitmap.width, image.bitmap.height);
						const newImage = new Jimp(image.bitmap.width, image.bitmap.height);
						tempImage.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
							const radians = (x * 180) / image.bitmap.width * Math.PI / 180;
							const offsetY = amount * Math.cos(radians);
							const newY = y + offsetY;
						
							const yFloor = Math.floor(newY);
							const yCeil = Math.ceil(newY);
							const yWeight = newY - yFloor;
						
							const clampedYFloor = Math.max(0, Math.min(image.bitmap.height - 1, yFloor));
							const clampedYCeil = Math.max(0, Math.min(image.bitmap.height - 1, yCeil));
						
							const colorFloor = Jimp.intToRGBA(image.getPixelColor(x, clampedYFloor));
							const colorCeil = Jimp.intToRGBA(image.getPixelColor(x, clampedYCeil));
						
							const r = colorFloor.r * (1 - yWeight) + colorCeil.r * yWeight;
							const g = colorFloor.g * (1 - yWeight) + colorCeil.g * yWeight;
							const b = colorFloor.b * (1 - yWeight) + colorCeil.b * yWeight;
							const a = colorFloor.a * (1 - yWeight) + colorCeil.a * yWeight;
						
							const interpolatedColor = Jimp.rgbaToInt(r, g, b, a);
							newImage.setPixelColor(interpolatedColor, x, y);
						});						
						newImage.autocrop()
						let b64 = await newImage.getBase64Async(Jimp.AUTO)
						json.status = 'success'
						json.data = b64
						event.sender.send('warp-text-response', json)
					} catch (error) {
						console.error('Error applying wave effect:', error);
						return null;
					}
				}
				break;
			default:
				Jimp.read(buffer, (err, image) => {
					image.getBase64(Jimp.AUTO, (err, ret) => {
						json.status = 'success'
						json.data = ret
						event.sender.send('warp-text-response', json)
					})
				})
				break;		
		}
	} catch (err) {
		json.status = 'error'
		json.message = err.message
		log.error(err);
		event.sender.send('warp-text-response', json)
	}
})

ipcMain.on('drop-image', (event, arg) => {
    let json = {}
	Jimp.read(arg, (err, image) => {
		if (err) {
			json.filename = "error not an image"
			json.image = "error not an image"
			event.sender.send('upload-image-response', json)
		} else {
			image.getBase64(Jimp.AUTO, (err, ret) => {
				json.path = arg
				json.filename = path.basename(arg)
				json.image = ret
				//json.palette = palette
				event.sender.send('upload-image-response', json)
			})
		}
	})
	.catch(err => { 
		console.log(err)
		json.filename = "error not an image"
		json.image = "error not an image"
		event.sender.send('upload-image-response', err) 
	})		
})

ipcMain.on('drop-font', (event, arg) => {
    let json = {}
    try {
		const filePath = path.join(userFontsFolder,path.basename(arg))
		const fontMeta = fontname.parse(fs.readFileSync(arg))[0];
		var ext = getExtension(arg)
		var fontPath = url.pathToFileURL(arg)
		json = {
			"status": "ok",
			"fontName": fontMeta.fullName,
			"fontStyle": fontMeta.fontSubfamily,
			"familyName": fontMeta.fontFamily,
			"fontFormat": ext,
			"fontMimetype": 'font/' + ext,
			"fontData": fontPath.href,
			"fontPath": filePath
		};
		fs.copyFileSync(arg, filePath)
		event.sender.send('local-font-response', json)
	} catch (err) {
		json = {
			"status": "error",
			"fontName": path.basename(arg),
			"fontPath": arg,
			"message": err
		}
		event.sender.send('local-font-response', json)
		//fs.unlinkSync(req.query.file)
	}
})

ipcMain.on('show-alert', (event, arg) => {
	dialog.showMessageBox(null, {
		type: 'info',
		message: arg
	})
})

function getExtension(filename) {
	var ext = path.extname(filename||'').split('.');
	return ext[ext.length - 1];
  }

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1280,
      height: 760,
	  icon: (__dirname + '/images/sweater.png'),
      webPreferences: {
		nodeIntegration: true,
		contextIsolation: false
	  }
    })

	const template = [
		// { role: 'appMenu' }
		...(isMac ? [{
			label: app.name,
			submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' }
			]
		}] : []),
		// { role: 'fileMenu' }
		{
			label: 'File',
			submenu: [
				{
					click: () => mainWindow.webContents.send('save','click'),
					accelerator: isMac ? 'Cmd+S' : 'Control+S',
					label: 'Save Sweater',
				},
				{
				  click: () => mainWindow.webContents.send('import-image','click'),
				  accelerator: isMac ? 'Cmd+I' : 'Control+I',
				  label: 'Import Image',
				},
				{
				  click: () => mainWindow.webContents.send('import-font','click'),
				  accelerator: isMac ? 'Cmd+F' : 'Control+F',
				  label: 'Import Font',
				},
				
				{ type: 'separator' },
				isMac ? { role: 'close' } : { role: 'quit' }
			]
		},
		// { role: 'viewMenu' }
		{
			label: 'View',
			submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
			]
		},
		{
			label: 'Window',
			submenu: [
			{ role: 'minimize' },
			{ role: 'zoom' },
			...(isMac ? [
				{ type: 'separator' },
				{ role: 'front' },
				{ type: 'separator' },
				{ role: 'window' }
			] : [
				{ role: 'close' }
			])
			]
		},
		{
			role: 'help',
			submenu: [
				{
					click: () => mainWindow.webContents.send('about','click'),
						label: 'About the FHM Sweater Factory',
				},
				{
					label: 'About Franchise Hockey Manager',
					click: async () => {    
					await shell.openExternal('https://www.ootpdevelopments.com/franchise-hockey-manager-home/')
					}
				},
				{
					label: 'About Node.js',
					click: async () => {    
					await shell.openExternal('https://nodejs.org/en/about/')
					}
				},
				{
					label: 'About Electron',
					click: async () => {
					await shell.openExternal('https://electronjs.org')
					}
				},
				{
					label: 'About Fabric.js',
					click: async () => {
					await shell.openExternal('http://fabricjs.com/')
					}
				},
				{
					label: 'View project on GitHub',
					click: async () => {
					await shell.openExternal('https://github.com/eriqjaffe/FHM-Sweater-Factory')
					}
				},
				{
					click: () => mainWindow.webContents.send('update','click'),
					label: 'Check For Updates',
				},
				{ type: 'separator' },
				{
					click: () => mainWindow.webContents.send('prefs','click'),
					accelerator: isMac ? 'Cmd+Shift+P' : 'Control+Shift+P',
					label: 'Edit Preferences',
				}
			]
		}
	]

	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)

	watcher.on('add', (path, stats) => {
		mainWindow.webContents.send('updateFonts','click')
	})
  
    // and load the index.html of the app.
    mainWindow.loadURL(`file://${__dirname}/index.html`);

	mainWindow.webContents.on('new-window', function(e, url) {
		e.preventDefault();
		require('electron').shell.openExternal(url);
	});

	// Open the DevTools.
    //mainWindow.maximize()
    //mainWindow.webContents.openDevTools()
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.
