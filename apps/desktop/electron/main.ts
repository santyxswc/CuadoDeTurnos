import path from 'node:path';
import { app, BrowserWindow } from 'electron';

// En desarrollo carga el servidor de Vite; en producción, el build empaquetado.
const urlDesarrollo = process.env.VITE_DEV_SERVER_URL;

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'TurnoCare',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (urlDesarrollo) {
    void ventana.loadURL(urlDesarrollo);
  } else {
    void ventana.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

void app.whenReady().then(() => {
  crearVentana();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
