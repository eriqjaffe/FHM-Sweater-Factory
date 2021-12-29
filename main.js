const { app, BrowserWindow, dialog, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs');
const express = require('express');
const Jimp = require('jimp');
const imagemagickCli = require('imagemagick-cli');
const { createSVGWindow } = require('svgdom')
const window = createSVGWindow()
const document = window.document
const { SVG, registerWindow } = require('@svgdotjs/svg.js')
const TextToSVG = require('text-to-svg');
const ttfInfo = require('ttfinfo');
const isMac = process.platform === 'darwin'
const os = require('os');
const tempDir = os.tmpdir()
const url = require('url');

const app2 = express()
const port = 8080;

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
// { role: 'windowMenu' }
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

app2.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app2.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));

app2.get("/uploadImage", (req, res) => {
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
						res.json({
							"filename": path.basename(result.filePaths[0]),
							"image": ret
						  });
						res.end();
					})
				}
			});
		  }
	  }).catch(err => {
		console.log(err)
	  })
})

app2.post('/saveJersey', (req, res) => {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');

	const options = {
		defaultPath: app.getPath('desktop') + '/' + req.body.name,
	}

	dialog.showSaveDialog(null, options).then((result) => {
		if (!result.canceled) {
			Jimp.read(buffer, (err, fir_img) => {
			if(err) {
				console.log(err);
			} else {
				var watermark = fs.readFileSync(__dirname + "\\images\\fhm_watermark.png", {encoding: 'base64'});
				var buffer = Buffer.from(watermark, 'base64');
					Jimp.read(buffer, (err, sec_img) => {
						if(err) {
							console.log(err);
						} else {
							fir_img.composite(sec_img, 0, 0);
							fir_img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
								const finalImage = Buffer.from(buffer).toString('base64');
								fs.writeFile(result.filePath, finalImage, 'base64', function(err) {
									console.log(err);
								});
							  });
							
						}
					})
				}
			});
		} 
	}).catch((err) => {
		console.log(err);
	});
});

app2.post('/warpText', (req, res)=> {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var amount = req.body.amount;
	var deform = req.body.deform;
	var width;
	var height;
	var cmdLine;
	console.log(req.body.deform)
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.autocrop();
			image.write(tempDir+"/temp.png");
			width = image.bitmap.width;
			height = image.bitmap.height;
			console.log(width +'x'+height)
			switch (deform) {
				case "arch":
					cmdLine = 'magick convert -background transparent -wave -'+amount+'x'+width*2+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png'
					break;
				case "arc":
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel Background -background transparent -distort Arc '+amount+' -trim +repage '+tempDir+'/'+deform+'.png'
					break;
				case "bilinearUp":
					console.log(amount)
					console.log(((100-amount)*0.01));
					var y2=height*((100-amount)*0.01)
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel transparent -interpolate Spline -distort BilinearForward "0,0 0,0 0,'+height+' 0,'+height+' '+width+',0 '+width+',0 '+width+','+height+' '+width+','+y2+'" '+tempDir+'/'+deform+'.png'
					break;
				case "bilinearDown":
					console.log(amount)
					console.log(((100-amount)*0.01));
					var y2=height*((100-amount)*0.01)
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel transparent -interpolate Spline -distort BilinearForward "0,0 0,0 0,'+height+' 0,'+y2+' '+width+',0 '+width+',0 '+width+','+height+' '+width+','+height+'" '+tempDir+'/'+deform+'.png'
					break;
				case "archUp":
					imagemagickCli.exec('magick convert '+tempDir+'/temp.png -gravity west -background transparent -extent '+width*2+'x'+height+' '+tempDir+'/temp.png').then(({stdout, stderr }) => {
						imagemagickCli.exec('magick convert -background transparent -wave -'+amount*2+'x'+width*4+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png').then(({ stdout, stderr }) => {
							Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
								if (err) {
									console.log(err);
								} else {
									image.getBase64(Jimp.AUTO, (err, ret) => {
										res.end(ret);
									})
								}
							})
						})
					})
					break;
				case "archDown":
					imagemagickCli.exec('magick convert '+tempDir+'/temp.png -gravity east -background transparent -extent '+width*2+'x'+height+' '+tempDir+'/temp.png').then(({stdout, stderr }) => {
						imagemagickCli.exec('magick convert -background transparent -wave -'+amount*2+'x'+width*4+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png').then(({ stdout, stderr }) => {
							Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
								if (err) {
									console.log(err);
								} else {
									image.getBase64(Jimp.AUTO, (err, ret) => {
										res.end(ret);
									})
								}
							})
						})
					})
					break;
				default:
					image.getBase64(Jimp.AUTO, (err, ret) => {
						res.end(ret);
					})
					break;
			}
			console.log(cmdLine);
			imagemagickCli.exec(cmdLine).then(({ stdout, stderr }) => {
				Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
					if (err) {
						console.log(err);
					} else {
						image.getBase64(Jimp.AUTO, (err, ret) => {
							res.end(ret);
						})
					}
				})
			})
		}
	})
})

app2.post('/archText', (req, res) => {
	console.log(req.body)
	var text = req.body.text;
	var fill = req.body.fill;
	var stroke1 = req.body.stroke1Color;
	var stroke2 = req.body.stroke2Color;
	var font = fontArray[req.body.font];
	var size = req.body.size;
	var stroke1Visible = (req.body.stroke1Visible === 'true');
	var stroke2Visible = (req.body.stroke2Visible === 'true');
	var fillVisible = (req.body.fillVisible === 'true');
	var svg2, svg1, svg, attributes, options, doc, path, base_d, s1path, s2path, fillPath, p

	registerWindow(window, document)

	const canvas = SVG(document.documentElement).size(512, 512)

	canvas.clear()

	var textToSVG = TextToSVG.loadSync('./fonts/'+font);

	if (stroke2Visible) {
		attributes = {fill: stroke2, stroke: stroke2, 'stroke-width': '10', id: 'stroke2'};
		options = {x: 30, y: 30, fontSize: size, anchor: 'top', attributes: attributes};
		svg2 = textToSVG.getPath(text, options);
		canvas.svg(svg2)
			}
	
	if (stroke1Visible) {
		attributes = {fill: stroke1, stroke: stroke1, 'stroke-width': '6', id: 'stroke1'};
		options = {x: 30, y: 30, fontSize: size, anchor: 'top', attributes: attributes};
		svg1 = textToSVG.getPath(text, options);
		canvas.svg(svg1)
	}
	
	if (fillVisible) {
		attributes = {fill: fill, id: 'fill'};
		options = {x: 30, y: 30, fontSize: size, anchor: 'top', attributes: attributes};
		svg = textToSVG.getPath(text, options);
		canvas.svg(svg)
	}

	s2path = document.getElementById('stroke2');
	base_d = s2path.getAttribute('d');
	p = new Path(base_d);
	p.warp({
		type: 'WARP_ARCH',
		bend : 15
	});
	s2path.setAttribute('d', p.output());

	s1path = document.getElementById('stroke1');
	base_d = s1path.getAttribute('d');
	p = new Path(base_d);
	p.warp({
		type: 'WARP_ARCH',
		bend : 15
	});
	s2path.setAttribute('d', p.output());

	fillPath = document.getElementById('fill');
	base_d = fillPath.getAttribute('d');
	p = new Path(base_d);
	p.warp({
		type: 'WARP_ARCH',
		bend : 15
	});
	fillPath.setAttribute('d', p.output());

	console.log(canvas.svg())

	

	/* var font_format = 'woff2'; // best compression
	var font_mimetype = 'font/' + font_format;
	var buff = fs.readFileSync(__dirname+'\\fonts\\'+font);
	var font_data = 'data:'+font_mimetype+';charset=ascii;base64,' + buff.toString('base64')

	registerWindow(window, document)

	const canvas = SVG(document.documentElement).size(512, 512)

	canvas.clear()

	canvas.defs().element('style').words(
		"@font-face {" +
		"  font-family: '"+req.body.font+"';" +
		"  src: url('"+font_data+"')" +
		"    format('"+font_format+"')" +
		"  ;" +
		"}"
	)

	var group = canvas.group();

	if (stroke2Visible) {
		var chars = group.text(text).font({
			size: size*1.25,
			fill: stroke2,
			family: req.body.font
		})
		chars.x(20)
		chars.y(20)
		chars.stroke({ color: stroke2, width: 10 })
	}

	if (stroke1Visible) {
		var chars = group.text(text).font({
			size: size*1.25,
			fill: stroke1,
			family: req.body.font
		})
		chars.x(20)
		chars.y(20)
		chars.stroke({ color: stroke1, width: 6 })
	}

	if (fillVisible) {
		var chars = group.text(text).font({
			size: size*1.25,
			fill: fill,
			family: req.body.font
		})
		chars.x(20)
		chars.y(20)
	}



	canvas.height(group.bbox().height+20);
	canvas.width(group.bbox().width+20)
	
	console.log(canvas.svg())
	var buff2 = Buffer.from(canvas.svg());
	res.end('data:image/svg+xml;base64,'+buff2.toString('base64')) */
})

app2.post('/jitterText', (req, res) => {
	console.log(req.body)
	var text = req.body.text;
	var diag = text.split("");
	var fill = req.body.fill;
	var stroke1 = req.body.stroke1Color;
	var stroke2 = req.body.stroke2Color;
	var font = fontArray[req.body.font];
	var size = req.body.size;
	var h = parseInt(req.body.hSpacing);
	var v = parseInt(req.body.vSpacing);
	var stroke1Visible = (req.body.stroke1Visible === 'true');
	var stroke2Visible = (req.body.stroke2Visible === 'true');
	var fillVisible = (req.body.fillVisible === 'true');
	var x = 10;
	var y = 10;
	var cmd;

	var font_name = 'custom';
	var font_format = 'woff2'; // best compression
	var font_mimetype = 'font/ttf';
	if (req.body.font.substring(0,5) === "file:") {
		var buff = fs.readFileSync(url.fileURLToPath(req.body.font));
	} else {
		var buff = fs.readFileSync(__dirname+'\\fonts\\'+req.body.font);
	}
	var font_data = 'data:'+font_mimetype+';charset=ascii;base64,' + buff.toString('base64')

	registerWindow(window, document)

	const canvas = SVG(document.documentElement).size(2048, 2048)

	canvas.clear()

	canvas.defs().element('style').words(
		"@font-face {" +
		"  font-family: 'temp';" +
		"  src: url('"+font_data+"')" +
		"    format('"+font_format+"')" +
		"  ;" +
		"}"
	)

	var group = canvas.group();

	if (stroke2Visible) {
		for (var i=0; i<diag.length; i++) {
			var text = group.text(diag[i]).font({
				size: size*2,
				fill: stroke2,
				family: 'temp'
			})
			text.x(x)
			text.y(y)
			text.stroke({ color: stroke2, width: 10 })
			x += h*2;
			y += v*2;
		}
	}
	x = 10;
	y = 10;

	if (stroke1Visible) {
		for (var i=0; i<diag.length; i++) {
			var text = group.text(diag[i])
			text.font({
				size: size*2,
				fill: stroke1,
				family: 'temp'
			})
			text.x(x)
			text.y(y)
			text.stroke({ color: stroke1, width: 6 })
			x += h*2;
			y += v*2;
		}
	}
	x = 10;
	y = 10;

	if (fillVisible) {
		for (var i=0; i<diag.length; i++) {
			var text = group.text(diag[i])
			text.font({
				size: size*2,
				fill: fill,
				family: 'temp'
			})
			text.x(x)
			text.y(y)
			x += h*2;
			y += v*2;
		}
	}
	group.x(10)
	group.y(10)
	canvas.height(group.bbox().height+20);
	canvas.width(group.bbox().width+20)
	var buff2 = Buffer.from(canvas.svg());
	res.end('data:image/svg+xml;base64,'+buff2.toString('base64'))
})

app2.get("/customFont", (req, res) => {
	dialog.showOpenDialog(null, {
		properties: ['openFile'],
		filters: [
			{ name: 'Fonts', extensions: ['ttf', 'otf'] }
		]
	}).then(result => {
		if(!result.canceled) {
			ttfInfo(result.filePaths[0], function(err, info) {
			var ext = getExtension(result.filePaths[0])
				//var buff = fs.readFileSync(result.filePaths[0]);
				//console.log(tempDir)
				var fontPath = url.pathToFileURL(tempDir + '/'+path.basename(result.filePaths[0]))
				//console.log(fontPath.href)
				fs.copyFile(result.filePaths[0], tempDir + '/'+path.basename(result.filePaths[0]), (err) => {
				//fs.copyFile(result.filePaths[0], path.join(app.getAppPath(), 'resources', 'app', 'fonts', path.basename(result.filePaths[0])), (err) => {
					if (err) {
						console.log(err)
					} else {
						res.json({
							"fontName": info.tables.name[1],
							"fontStyle": info.tables.name[2],
							"familyName": info.tables.name[6],
							"fontFormat": ext,
							"fontMimetype": 'font/' + ext,
							"fontData": fontPath.href
						});
						res.end()
					}
				})
				/* fs.writeFile(__dirname + '/fonts/'+path.basename(result.filePaths[0]), buff, function (err) {
					if (err) return console.log(err);
					res.json({
						"fontName": info.tables.name[1],
						"fontStyle": info.tables.name[2],
						"familyName": info.tables.name[6],
						"fontFormat": ext,
						"fontMimetype": 'font/' + ext,
						"fontData": 'data:'+'font/' + ext+';charset=ascii;base64,' + buff.toString('base64')
					});
				  });
				
			res.end() */
			});
		}
	}).catch(err => {
		console.log(err)
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
        //preload: path.join(__dirname, 'preload.js')
      }
    })
  
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

	mainWindow.webContents.on('new-window', function(e, url) {
		e.preventDefault();
		require('electron').shell.openExternal(url);
	});
  
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
