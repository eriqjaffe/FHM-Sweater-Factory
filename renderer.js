const { app, shell, ipcRenderer } = require('electron')

ipcRenderer.on('save', (event, data) => {
    $("#save").trigger("click")
});

ipcRenderer.on('import-image', (event, data) => {
    $("#fakeImageButton").trigger("click")
});

ipcRenderer.on('import-font', (event, data) => {
    $("#fakeFontButton").trigger("click")
});

ipcRenderer.on('updateFonts', (event, data) => {
    $("#localFontFolder").trigger("click")
})

ipcRenderer.on('about', (event, data) => {
    $("#aboutSweaterfactory").trigger("click")
});