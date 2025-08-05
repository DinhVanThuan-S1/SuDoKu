const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Hot reload trong development mode
if (process.argv.includes('--reload')) {
    try {
        require('electron-reload')(__dirname, {
            electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
            hardResetMethod: 'exit'
        });
        console.log('Hot reload đã được kích hoạt');
    } catch (error) {
        console.log('Không thể kích hoạt hot reload:', error.message);
    }
}

let mainWindow;
let flaskProcess;

/**
 * Khởi động Flask server
 */
function startFlaskServer() {
    const pythonScript = path.join(__dirname, '../backend/app.py');
    flaskProcess = spawn('python', [pythonScript]);
    
    flaskProcess.stdout.on('data', (data) => {
        console.log(`Flask: ${data}`);
    });
    
    flaskProcess.stderr.on('data', (data) => {
        console.error(`Flask Error: ${data}`);
    });
}

/**
 * Tạo cửa sổ chính
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets/icon.png'),
        show: false,
        titleBarStyle: 'default'
    });

    // Tải trang chính
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Hiển thị cửa sổ khi đã sẵn sàng
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Xử lý khi đóng cửa sổ
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Mở DevTools trong chế độ development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Đăng ký phím tắt reload trong development mode
    if (process.argv.includes('--dev') || process.argv.includes('--reload')) {
        globalShortcut.register('F5', () => {
            console.log('F5 pressed - Reloading window...');
            mainWindow.reload();
        });

        globalShortcut.register('Ctrl+R', () => {
            console.log('Ctrl+R pressed - Reloading window...');
            mainWindow.reload();
        });

        globalShortcut.register('Ctrl+Shift+R', () => {
            console.log('Ctrl+Shift+R pressed - Hard reload...');
            mainWindow.webContents.reloadIgnoringCache();
        });

        // Đăng ký phím tắt để toggle DevTools
        globalShortcut.register('F12', () => {
            console.log('F12 pressed - Toggle DevTools...');
            mainWindow.webContents.toggleDevTools();
        });
    }
}

/**
 * Sự kiện khi app sẵn sàng
 */
app.whenReady().then(() => {
    // Khởi động Flask server
    startFlaskServer();
    
    // Đợi một chút để Flask khởi động
    setTimeout(() => {
        createWindow();
    }, 2000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

/**
 * Thoát app khi tất cả cửa sổ đã đóng
 */
app.on('window-all-closed', () => {
    // Hủy đăng ký tất cả phím tắt
    globalShortcut.unregisterAll();
    
    // Đóng Flask server
    if (flaskProcess) {
        flaskProcess.kill();
    }
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

/**
 * Xử lý sự kiện từ renderer process
 */
ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// Xử lý reload từ renderer
ipcMain.handle('reload-app', () => {
    if (mainWindow) {
        console.log('Reload requested from renderer...');
        mainWindow.reload();
    }
});

// Xử lý toggle DevTools từ renderer  
ipcMain.handle('toggle-devtools', () => {
    if (mainWindow) {
        console.log('Toggle DevTools requested from renderer...');
        mainWindow.webContents.toggleDevTools();
    }
});

// Xử lý thoát app
ipcMain.handle('quit-app', () => {
    app.quit();
});