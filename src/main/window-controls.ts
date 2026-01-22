import { ipcMain, BrowserWindow } from 'electron'

ipcMain.on('window:minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  window?.minimize()
})

ipcMain.on('window:maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window?.isMaximized()) {
    window.unmaximize()
  } else {
    window?.maximize()
  }
})

ipcMain.on('window:close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  window?.close()
})

ipcMain.handle('window:isMaximized', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  return window?.isMaximized()
})
