//////////////////////////////////////////////////////////////////////
//	Copyright (C) Hiroshi SUGIMURA 2018.03.16
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
// PicoGW = Minimalist's Home Gateway
const controller = require('./node_modules/picogw/lib/controller');
const PubSub = require('./node_modules/picogw/lib/pub-sub').PubSub;
const log = console.log;

const package_json = require('./node_modules/picogw/package.json');
log(`PicoGW \u001b[31mv${package_json.version}\u001b[0m`);

// Support for termux
if (process.platform == 'android') {
    Object.defineProperty(process, 'platform', {get: function() {
        return 'linux';
    }});
}

// Parse command line
let cmdOpts = require('opts');
cmdOpts.parse([
    {
        'short': 'c',
        'long': 'config',
        'description': 'Path of config file.'
            + ' The default is "config.json" in $HOME/.picogw/config.json or ./config.json', // eslint-disable-line max-len
        'value': true,
        'required': false,
    },
    {
        'short': 'p',
        'long': 'port',
        'description': 'Web API port number. The default is 8080.',
        'value': true,
        'required': false,
    },
    {
        'long': 'pipe',
        'description': 'Path of named pipes without postfix (_r or _w).'
            + ' The server is blocked until the pipe client is connected.',
        'value': true,
        'required': false,
    },
], true);

controller.init({PubSub: PubSub, cmd_opts: cmdOpts}).then((re)=>{
    log('Plugins have been initialized.');
}).catch((e) => {
    console.error(e);
});

log('PicoGW started.');

//////////////////////////////////////////////////////////////////////
// foreground
function createWindow() {
	mainWindow = new BrowserWindow({width: 1024, height: 768,
	  webPreferences: { nodeIntegration: false }
	});
	// mainWindow.setMenu(null);
	menuInitialize();
	mainWindow.loadURL('http://localhost:8080/index.html');

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
