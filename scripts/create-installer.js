const electronInstaller = require('electron-installer-squirrel-windows')
const path = require('path')

console.log('Creating windows installer...')

const resultPromise = electronInstaller.createWindowsInstaller({
  appDirectory: path.join(__dirname, '../release/Apex StudyOS-win32-x64'),
  outputDirectory: path.join(__dirname, '../release/installer'),
  authors: 'Tamil Venthan',
  exe: 'Apex StudyOS.exe',
  setupExe: 'Apex-StudyOS-Setup.exe',
  noMsi: true
})

resultPromise.then(
  () => console.log('It worked!'),
  (e) => console.log(`No dice: ${e.message}`)
)
