import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { autoUpdater } from 'electron-updater';
import icon from '../../resources/icon.ico?asset';
import './ipc-handlers';
import './db-init';
import './window-controls';
import { initializeDatabase } from './db-init';
// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
let mainWindow = null;
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        autoHideMenuBar: true,
        title: 'Apex StudyOS',
        frame: false,
        ...(process.platform === 'linux' || process.platform === 'win32' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.on('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });
    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
    else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.apex.studytracker');
    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });
    console.log('IPC handlers loaded');
    // Initialize database
    await initializeDatabase();
    createWindow();
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
// Auto-updater event listeners
autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-checking');
});
autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info);
});
autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-not-available');
});
autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-download-progress', progress);
});
autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-downloaded', info);
});
autoUpdater.on('error', (error) => {
    mainWindow?.webContents.send('update-error', error.message);
});
// Auto-updater IPC handlers
ipcMain.handle('check-for-updates', async () => {
    if (!is.dev) {
        try {
            const result = await autoUpdater.checkForUpdates();
            return result;
        }
        catch (error) {
            console.error('Error checking for updates:', error);
            return null;
        }
    }
    return null;
});
ipcMain.handle('download-update', async () => {
    if (!is.dev) {
        try {
            await autoUpdater.downloadUpdate();
            return true;
        }
        catch (error) {
            console.error('Error downloading update:', error);
            return false;
        }
    }
    return false;
});
ipcMain.handle('install-update', () => {
    if (!is.dev) {
        autoUpdater.quitAndInstall(false, true);
    }
});
// Check for updates when app is ready (only in production)
app.on('ready', () => {
    if (!is.dev) {
        setTimeout(() => {
            autoUpdater.checkForUpdates();
        }, 3000); // Check 3 seconds after app starts
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
