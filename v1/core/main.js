//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2020.08.12
//////////////////////////////////////////////////////////////////////
'use strict'

// app frame config
const appname = 'ELDeviceEmulator';

//////////////////////////////////////////////////////////////////////
// 基本ライブラリ
const {app, BrowserWindow, ipcMain, Menu, shell} = require('electron');
const {default: installExtension, VUEJS_DEVTOOLS } = require("electron-devtools-installer");

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

// フォルダがなければ作る
if (!fs.existsSync(configDir)) {
	fs.mkdirSync(configDir);
}

// configファイルコピー
const src1 = path.join( __dirname, 'conf/config.json');
const src2 = path.join( __dirname, 'data/current_eoj_list.json');
const src3 = path.join( __dirname, 'data/state_0EF001.json');
const src4 = path.join( __dirname, 'data/state_013001.json');
const src5 = path.join( __dirname, 'data/user_conf.json');

const dst1 = path.join( configDir, 'config.json');
const dst2 = path.join( configDir, 'current_eoj_list.json');
const dst3 = path.join( configDir, 'state_0EF001.json');
const dst4 = path.join( configDir, 'state_013001.json');
const dst5 = path.join( configDir, 'user_conf.json');

fs.copyFileSync( src1, dst1, (e)=> { console.log('conf1 exsits.'); });
fs.copyFileSync( src2, dst2, (e)=> { console.log('conf2 exsits.'); });
fs.copyFileSync( src3, dst3, (e)=> { console.log('conf3 exsits.'); });
fs.copyFileSync( src4, dst4, (e)=> { console.log('conf4 exsits.'); });
fs.copyFileSync( src5, dst5, (e)=> { console.log('conf5 exsits.'); });

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
let mEmulator = new ELEmu(configDir);
mEmulator.init();


console.log('ELDeviceEmulator beggins.');


//////////////////////////////////////////////////////////////////////
// Communication for Electron's Renderer process
//////////////////////////////////////////////////////////////////////
// IPC 受信から非同期で実行
ipcMain.on('to-main', function(event, arg) {
	// メッセージが来たとき
	console.log( '---  sended from Renderer.' );
	console.log(arg);

	let c = JSON.parse(arg);

	switch ( c.cmd ) {
	  case "already": // 準備出来たらRenderer更新して，INF
		break;

	  default:
		console.log( "## get error cmd : " + arg );
		break;
	}
});



//////////////////////////////////////////////////////////////////////
// foreground
function createWindow() {

	mainWindow = new BrowserWindow({width: 1024, height: 768,
	  webPreferences: { nodeIntegration: false, worldSafeExecuteJavaScript: true, preload:'http://localhost:8880/elemu.js' }
	});
	// mainWindow.setMenu(null);
	menuInitialize();
	mainWindow.loadURL('http://localhost:8880/');


	if (isDevelopment) { // 開発モードならDebugGUIひらく
		mainWindow.webContents.openDevTools();
		require('vue-devtools').install();
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
