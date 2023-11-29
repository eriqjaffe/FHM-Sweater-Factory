const { app, BrowserWindow, dialog, Menu, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs');
const express = require('express');
const Jimp = require('jimp');
const imagemagickCli = require('imagemagick-cli');
const { createSVGWindow } = require('svgdom')
const window = createSVGWindow()
const isMac = process.platform === 'darwin'
const os = require('os');
const tempDir = os.tmpdir()
const url = require('url');
const increment = require('add-filename-increment');
const Store = require("electron-store")
const fontname = require("fontname")
const chokidar = require('chokidar')
const font2base64 = require("node-font2base64")
const hasbin = require('hasbin')

const store = new Store();

const userFontsFolder = path.join(app.getPath('userData'),"fonts")

const imWarning = store.get("imWarning", true)

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

const imInstalled = hasbin.sync('magick');

ipcMain.on('imagemagick-warning', (event, arg) => {
	if (!imInstalled) {
		event.sender.send('hide-imagemagick', null)
		if (imWarning) {
			dialog.showMessageBox({
				noLink: true,
				type: 'info',
				buttons: ['OK', 'Download'],
				message: 'ImageMagick was not detected, some functionality will not be available.',
				checkboxLabel: 'Don\'t warn me again',
				checkboxChecked: false
			}).then(result => {
				if (result.checkboxChecked) {
					store.set("imWarning", false)
				} else {
					store.set("imWarning", true)
				}
				if (result.response === 1) {
					switch (process.platform) {
						case "darwin":
							shell.openExternal("https://imagemagick.org/script/download.php#macosx")
							break;
						case "linux":
							shell.openExternal("https://imagemagick.org/script/download.php#linux")
							break;
						case "win32":
							shell.openExternal("https://imagemagick.org/script/download.php#windows")
							break;
					}
					app.quit()
				} 
			})	
		} 
	}
})

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
				const dataUrl = font2base64.encodeToDataUrlSync(filePath)
				var fontPath = url.pathToFileURL(filePath)
				var json = {
					"status": "ok",
					"fontName": fontMeta.fullName,
					"fontStyle": fontMeta.fontSubfamily,
					"familyName": fontMeta.fontFamily,
					"fontFormat": ext,
					"fontMimetype": 'font/' + ext,
					"fontData": fontPath.href,
					"fontBase64": dataUrl,
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

ipcMain.on('warp-text', (event, arg) => {
	let buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	let amount = arg.amount;
	let deform = arg.deform;
	let width;
	let height;
	let cmdLine;
	let json = {}
	Jimp.read(buffer, (err, image) => {
		if (err) {
			json.status = 'error'
			json.message = err
			console.log(err);
			event.sender.send('warp-text-response', json)
		} else {
			image.autocrop();
			image.write(tempDir+"/temp.png");
			width = image.bitmap.width;
			height = image.bitmap.height;
			switch (deform) {
				case "arch":
					cmdLine = 'magick convert -background transparent -wave -'+amount+'x'+width*2+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png'
					break;
				case "arc":
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel Background -background transparent -distort Arc '+amount+' -trim +repage '+tempDir+'/'+deform+'.png'
					break;
				case "bilinearUp":
					var y2=height*((100-amount)*0.01)
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel transparent -interpolate Spline -distort BilinearForward "0,0 0,0 0,'+height+' 0,'+height+' '+width+',0 '+width+',0 '+width+','+height+' '+width+','+y2+'" '+tempDir+'/'+deform+'.png'
					break;
				case "bilinearDown":
					var y2=height*((100-amount)*0.01)
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel transparent -interpolate Spline -distort BilinearForward "0,0 0,0 0,'+height+' 0,'+y2+' '+width+',0 '+width+',0 '+width+','+height+' '+width+','+height+'" '+tempDir+'/'+deform+'.png'
					break;
				case "archUp":
					try {
						imagemagickCli.exec('magick convert '+tempDir+'/temp.png -gravity west -background transparent -extent '+width*2+'x'+height+' '+tempDir+'/temp.png').then(({stdout, stderr }) => {
							imagemagickCli.exec('magick convert -background transparent -wave -'+amount*2+'x'+width*4+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png').then(({ stdout, stderr }) => {
								Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
									if (err) {
										json.status = 'error'
										json.message = err
										console.log(err);
										event.sender.send('warp-text-response', json)
									} else {
										image.getBase64(Jimp.AUTO, (err, ret) => {
											json.status = 'success'
											json.data = ret
											event.sender.send('warp-text-response', json)
											//res.end(ret);
										})
									}
								})
							})
						})
					} catch (err) {
						json.status = 'error'
						json.message = err
						console.log(err);
						event.sender.send('warp-text-response', json)
					}
					break;
				case "archDown":
					try {
						imagemagickCli.exec('magick convert '+tempDir+'/temp.png -gravity east -background transparent -extent '+width*2+'x'+height+' '+tempDir+'/temp.png').then(({stdout, stderr }) => {
							imagemagickCli.exec('magick convert -background transparent -wave -'+amount*2+'x'+width*4+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png').then(({ stdout, stderr }) => {
								Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
									if (err) {
										json.status = 'error'
										json.message = err
										console.log(err);
										event.sender.send('warp-text-response', json)
									} else {
										image.getBase64(Jimp.AUTO, (err, ret) => {
											json.status = 'success'
											json.data = ret
											event.sender.send('warp-text-response', json)
										})
									}
								})
							})
						})
					} catch (err) {
						json.status = 'error'
						json.message = err
						console.log(err);
						event.sender.send('warp-text-response', json)
					}
					break;
				default:
					image.getBase64(Jimp.AUTO, (err, ret) => {
						json.status = 'success'
						json.data = ret
						event.sender.send('warp-text-response', json)
					})
					break;
			}
			try {
				imagemagickCli.exec(cmdLine).then(({ stdout, stderr }) => {
					Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
						if (err) {
							json.status = 'error'
							json.message = err
							console.log(err);
							event.sender.send('warp-text-response', json)
						} else {
							image.getBase64(Jimp.AUTO, (err, ret) => {
								json.status = 'success'
								json.data = ret
								event.sender.send('warp-text-response', json)
							})
						}
					})
				})
			} catch (err) {
				json.status = 'error'
				json.message = err
				console.log(err);
				event.sender.send('warp-text-response', json)
			}
		}
	})
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
    mainWindow.maximize()
    mainWindow.webContents.openDevTools()
  
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
