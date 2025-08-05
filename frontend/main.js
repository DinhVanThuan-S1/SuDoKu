const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

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

// Xử lý thoát app
ipcMain.handle('quit-app', () => {
    app.quit();
});