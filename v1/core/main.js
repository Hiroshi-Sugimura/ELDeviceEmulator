//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2020.08.12
//////////////////////////////////////////////////////////////////////
'use strict'

// app frame config
const appname = 'HEMS-Logger';

//////////////////////////////////////////////////////////////////////
// 基本ライブラリ
const {app, BrowserWindow, ipcMain, Menu, shell} = require('electron');
const path = require('path');
const util = require('util');
const os  = require('os');
const fs  = require('fs');

const isDevelopment = process.env.NODE_ENV == 'development'

// electronのmain window
let mainWindow = null;

// electronのファイル読み込み対策，developmentで変更できるようにしたけどつかってない
const appDir     = process.env.NODE_ENV === 'development' ? __dirname : __dirname;
const userHome   = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
const configDir  = path.join( userHome, appname);
const configFile = path.join( configDir, 'config.json');

// フォルダがなければ作る
if (!fs.existsSync(configDir)) {
	fs.mkdirSync(configDir);
}

// configファイルがなければ無視，あれば読む
let config = {};
if (fs.existsSync(configFile)) {
	console.log('There is the configFile;', configFile );
	config = JSON.parse( fs.readFileSync( configFile, 'utf8') );
}


//////////////////////////////////////////////////////////////////////
// local function
//////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////
// Communication for Electron's Renderer process
//////////////////////////////////////////////////////////////////////
// IPC 受信から非同期で実行
ipcMain.on('to-main', function(event, arg) {
	// メッセージが来たとき
	console.log( '---  sended from Renderer.' );
	console.log(arg);
});


//////////////////////////////////////////////////////////////////////
// elemuのサーバとオブジェクトを作る
const ELEmu = require('./elemu.js');
let options = {
	'console-packet': false
};
mEmulator = new ELEmu(options);
mEmulator.init();



log('ELemu beggins.');


//////////////////////////////////////////////////////////////////////
// foreground
function createWindow() {
	mainWindow = new BrowserWindow({width: 1024, height: 768,
	  webPreferences: { nodeIntegration: false }
	});
	// mainWindow.setMenu(null);
	menuInitialize();
	mainWindow.loadURL('http://localhost:8880/');

	if (isDevelopment) { // 開発モードならDebugGUIひらく
		mainWindow.webContents.openDevTools()
	}

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
};

app.on('ready', createWindow);

// アプリケーションがアクティブになった時の処理
// （Macだと、Dockがクリックされた時）
app.on("activate", () => {
	// メインウィンドウが消えている場合は再度メインウィンドウを作成する
	if (mainWindow === null) {
		createWindow();
	}
});

app.on('window-all-closed', () => {
	// macだろうとプロセスはkillしちゃう
	app.quit();
});


// menu
const menuItems = [
	{
	  label: 'Electron',
	  submenu: [
		  {
			label: 'Preferences...',
			accelerator: 'Command+,',
			click: function() { shell.showItemInFolder(configDir); }
		  },
		  {
			label: 'Quit',
			accelerator: 'Command+Q',
			click: function() { app.quit(); }
		  }]
  }, {
	  label: 'View',
	  submenu: [
		  {
			label: 'Reload',
			accelerator: 'Command+R',
			  click(item, focusedWindow){
				  if(focusedWindow) focusedWindow.reload()
			  }
		  },
		  {
			label: 'Toggle Full Screen',
			accelerator: 'Ctrl+Command+F',
			click: function() { mainWindow.setFullScreen(!mainWindow.isFullScreen()); }
		  },
		  {
			label: 'Toggle Developer Tools',
			accelerator: 'Alt+Command+I',
			click: function() { mainWindow.toggleDevTools(); }
		  }
] } ];


function menuInitialize() {
	let menu = Menu.buildFromTemplate(menuItems);
	Menu.setApplicationMenu(menu);
	mainWindow.setMenu(menu);
}


//////////////////////////////////////////////////////////////////////
// EOF
//////////////////////////////////////////////////////////////////////
