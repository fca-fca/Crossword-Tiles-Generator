const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: path.join(__dirname, 'icon.png'), // Optional: if you have an icon
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Allows simple file interaction
    }
  });

  // Remove the top menu bar (File, Edit, View) for a cleaner look
  win.setMenuBarVisibility(false);

  // Load your interface
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});