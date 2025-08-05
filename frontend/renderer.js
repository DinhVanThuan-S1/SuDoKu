/**
 * Sudoku Game Renderer Process
 * Xử lý giao diện người dùng và tương tác với Flask backend
 */

// API Configuration
const API_BASE = 'http://localhost:5000/api';

// Game State Variables
let gameState = {
    board: [],
    originalBoard: [],
    solution: [],
    selectedCell: null,
    difficulty: 'medium',
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    isPaused: false,
    errors: 0,
    maxErrors: 3,
    hintsRemaining: 3,
    score: 0,
    isNoteMode: false,
    gameHistory: [], // Lưu lịch sử các nước đi để hoàn tác
    cellNotes: {} // Lưu ghi chú của từng ô
};

// UI Elements
const elements = {
    screens: {
        main: document.getElementById('main-screen'),
        difficulty: document.getElementById('difficulty-screen'),
        game: document.getElementById('game-screen')
    },
    buttons: {
        continue: document.getElementById('continue-btn'),
        newGame: document.getElementById('new-game-btn'),
        rules: document.getElementById('rules-btn'),
        scores: document.getElementById('scores-btn'),
        exit: document.getElementById('exit-btn'),
        backToMain: document.getElementById('back-to-main'),
        backToMenu: document.getElementById('back-to-menu'),
        pause: document.getElementById('pause-btn'),
        resume: document.getElementById('resume-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        undo: document.getElementById('undo-btn'),
        erase: document.getElementById('erase-btn'),
        note: document.getElementById('note-btn'),
        hint: document.getElementById('hint-btn'),
        solve: document.getElementById('solve-btn')
    },
    displays: {
        score: document.getElementById('score-display'),
        errors: document.getElementById('errors-display'),
        difficulty: document.getElementById('difficulty-display'),
        time: document.getElementById('time-display'),
        hintsCount: document.getElementById('hints-count')
    },
    containers: {
        grid: document.getElementById('sudoku-grid'),
        numberPad: document.querySelector('.number-buttons'),
        pausedOverlay: document.getElementById('paused-overlay')
    },
    modals: {
        rules: document.getElementById('rules-modal'),
        scores: document.getElementById('scores-modal'),
        gameOver: document.getElementById('game-over-modal'),
        loading: document.getElementById('loading-overlay')
    }
};

/**
 * Khởi tạo ứng dụng
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Khởi tạo ứng dụng
 */
async function initializeApp() {
    try {
        // Kiểm tra theme đã lưu
        loadTheme();
        
        // Kiểm tra game đã lưu
        await checkSavedGame();
        
        // Khởi tạo event listeners
        initializeEventListeners();
        
        // Tạo giao diện
        createSudokuGrid();
        createNumberPad();
        
        console.log('Ứng dụng đã khởi tạo thành công');
    } catch (error) {
        console.error('Lỗi khởi tạo ứng dụng:', error);
        showError('Không thể khởi tạo ứng dụng');
    }
}

/**
 * Khởi tạo event listeners
 */
function initializeEventListeners() {
    // Main menu buttons
    elements.buttons.continue?.addEventListener('click', continueGame);
    elements.buttons.newGame?.addEventListener('click', showDifficultyScreen);
    elements.buttons.rules?.addEventListener('click', showRulesModal);
    elements.buttons.scores?.addEventListener('click', showScoresModal);
    elements.buttons.exit?.addEventListener('click', exitApp);
    
    // Difficulty buttons
    elements.buttons.backToMain?.addEventListener('click', showMainScreen);
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const difficulty = e.currentTarget.dataset.difficulty;
            startNewGame(difficulty);
        });
    });
        // Game control buttons
    elements.buttons.backToMenu?.addEventListener('click', backToMenu);
    elements.buttons.pause?.addEventListener('click', togglePause);
    elements.buttons.resume?.addEventListener('click', togglePause);
    elements.buttons.themeToggle?.addEventListener('click', toggleTheme);
    
    // Action buttons
    elements.buttons.undo?.addEventListener('click', undoMove);
    elements.buttons.erase?.addEventListener('click', eraseCell);
    elements.buttons.note?.addEventListener('click', toggleNoteMode);
    elements.buttons.hint?.addEventListener('click', getHint);
    elements.buttons.solve?.addEventListener('click', solvePuzzle);
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Game over modal buttons
    document.getElementById('new-game-over-btn')?.addEventListener('click', () => {
        closeModals();
        showDifficultyScreen();
    });
    
    document.getElementById('retry-game-btn')?.addEventListener('click', () => {
        closeModals();
        retryGame();
    });
    
    document.getElementById('menu-game-over-btn')?.addEventListener('click', () => {
        closeModals();
        showMainScreen();
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModals();
            }
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

/**
 * Xử lý phím tắt
 */
function handleKeyboard(e) {
    if (!elements.screens.game.classList.contains('active')) return;
    
    // Số 1-9
    if (e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        if (gameState.selectedCell) {
            inputNumber(num);
        }
    }
    
    // Xóa (Delete, Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
        eraseCell();
    }
    
    // Hoàn tác (Ctrl+Z)
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoMove();
    }
    
    // Ghi chú (N key)
    if (e.key === 'n' || e.key === 'N') {
        toggleNoteMode();
    }
    
    // Gợi ý (H key)
    if (e.key === 'h' || e.key === 'H') {
        getHint();
    }
    
    // Tạm dừng (Space hoặc P)
    if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
    }
    
    // Di chuyển với mũi tên
    if (gameState.selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        moveSelection(e.key);
    }
}

/**
 * Di chuyển ô được chọn bằng phím mũi tên
 */
function moveSelection(direction) {
    if (!gameState.selectedCell) return;
    
    const { row, col } = gameState.selectedCell;
    let newRow = row;
    let newCol = col;
    
    switch (direction) {
        case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            break;
        case 'ArrowDown':
            newRow = Math.min(8, row + 1);
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            break;
        case 'ArrowRight':
            newCol = Math.min(8, col + 1);
            break;
    }
    
    if (newRow !== row || newCol !== col) {
        selectCell(newRow, newCol);
    }
}

/**
 * Tạo lưới Sudoku 9x9
 */
function createSudokuGrid() {
    const grid = elements.containers.grid;
    grid.innerHTML = '';
    
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        const row = Math.floor(i / 9);
        const col = i % 9;
        
        cell.className = 'sudoku-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.index = i;
        
        // Thêm event listener
        cell.addEventListener('click', () => selectCell(row, col));
        
        grid.appendChild(cell);
    }
}

/**
 * Tạo bàn phím số
 */
function createNumberPad() {
    const numberPad = elements.containers.numberPad;
    numberPad.innerHTML = '';
    
    for (let num = 1; num <= 9; num++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.dataset.number = num;
        
        btn.innerHTML = `
            <span class="number-value">${num}</span>
            <span class="number-remaining" id="remaining-${num}">9</span>
        `;
        
        btn.addEventListener('click', () => inputNumber(num));
        numberPad.appendChild(btn);
    }
}

/**
 * Kiểm tra game đã lưu
 */
async function checkSavedGame() {
    try {
        const response = await fetch(`${API_BASE}/load-game`);
        const data = await response.json();
        
        if (data.success && data.game_data) {
            elements.buttons.continue.style.display = 'block';
            return true;
        }
    } catch (error) {
        console.error('Lỗi kiểm tra game đã lưu:', error);
    }
    
    elements.buttons.continue.style.display = 'none';
    return false;
}

/**
 * Hiển thị màn hình chính
 */
function showMainScreen() {
    hideAllScreens();
    elements.screens.main.classList.add('active');
    checkSavedGame(); // Cập nhật nút Continue
}

/**
 * Hiển thị màn hình chọn độ khó
 */
function showDifficultyScreen() {
    hideAllScreens();
    elements.screens.difficulty.classList.add('active');
}

/**
 * Hiển thị màn hình game
 */
function showGameScreen() {
    hideAllScreens();
    elements.screens.game.classList.add('active');
}

/**
 * Ẩn tất cả màn hình
 */
function hideAllScreens() {
    elements.screens.main.classList.remove('active');
    elements.screens.difficulty.classList.remove('active');
    elements.screens.game.classList.remove('active');
}

/**
 * Bắt đầu game mới
 */
async function startNewGame(difficulty) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/new-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ difficulty })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Khởi tạo trạng thái game mới
            gameState = {
                board: JSON.parse(JSON.stringify(data.puzzle)),
                originalBoard: JSON.parse(JSON.stringify(data.original_puzzle)),
                solution: JSON.parse(JSON.stringify(data.solution)),
                selectedCell: null,
                difficulty: difficulty,
                startTime: Date.now(),
                elapsedTime: 0,
                timerInterval: null,
                isPaused: false,
                errors: 0,
                maxErrors: 3,
                hintsRemaining: 3,
                score: 0,
                isNoteMode: false,
                gameHistory: [],
                cellNotes: {}
            };
            
            // Cập nhật giao diện
            updateBoard();
            updateGameInfo();
            startTimer();
            showGameScreen();
            
            console.log('Game mới đã được tạo:', difficulty);
        } else {
            showError('Không thể tạo game mới: ' + data.error);
        }
    } catch (error) {
        console.error('Lỗi tạo game mới:', error);
        showError('Lỗi kết nối server');
    } finally {
        showLoading(false);
    }
}

/**
 * Tiếp tục game đã lưu
 */
async function continueGame() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/load-game`);
        const data = await response.json();
        
        if (data.success && data.game_data) {
            // Khôi phục trạng thái game
            gameState = {
                ...data.game_data,
                timerInterval: null,
                isPaused: false,
                selectedCell: null
            };
            
            // Cập nhật giao diện
            updateBoard();
            updateGameInfo();
            startTimer();
            showGameScreen();
            
            console.log('Game đã được tiếp tục');
        } else {
            showError('Không thể tải game đã lưu');
        }
    } catch (error) {
        console.error('Lỗi tải game:', error);
        showError('Lỗi kết nối server');
    } finally {
        showLoading(false);
    }
}

/**
 * Lưu game hiện tại
 */
async function saveGame() {
    try {
        const saveData = {
            board: gameState.board,
            originalBoard: gameState.originalBoard,
            solution: gameState.solution,
            difficulty: gameState.difficulty,
            startTime: gameState.startTime,
            elapsedTime: gameState.elapsedTime,
            errors: gameState.errors,
            hintsRemaining: gameState.hintsRemaining,
            score: gameState.score,
            gameHistory: gameState.gameHistory,
            cellNotes: gameState.cellNotes
        };
        
        const response = await fetch(`${API_BASE}/save-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(saveData)
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Lỗi lưu game:', error);
        return false;
    }
}

/**
 * Quay lại menu chính (tự động lưu game)
 */
async function backToMenu() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Lưu game trước khi thoát
    await saveGame();
    showMainScreen();
}

/**
 * Chọn ô trong lưới
 */
function selectCell(row, col) {
    if (gameState.isPaused) return;
    
    // Bỏ chọn ô hiện tại
    document.querySelectorAll('.sudoku-cell').forEach(cell => {
        cell.classList.remove('selected', 'highlighted', 'same-number');
    });
    
    // Chọn ô mới
    gameState.selectedCell = { row, col };
    const cellIndex = row * 9 + col;
    const selectedCell = document.querySelector(`[data-index="${cellIndex}"]`);
    
    if (selectedCell) {
        selectedCell.classList.add('selected');
        
        // Highlight hàng, cột và khối 3x3
        highlightRelatedCells(row, col);
        
        // Highlight các ô có cùng số
        const cellValue = gameState.board[row][col];
        if (cellValue !== 0) {
            highlightSameNumbers(cellValue);
        }
    }
}

/**
 * Highlight các ô liên quan (hàng, cột, khối 3x3)
 */
function highlightRelatedCells(row, col) {
    for (let i = 0; i < 9; i++) {
        // Highlight hàng
        const rowCell = document.querySelector(`[data-row="${row}"][data-col="${i}"]`);
        if (rowCell) rowCell.classList.add('highlighted');
        
        // Highlight cột
        const colCell = document.querySelector(`[data-row="${i}"][data-col="${col}"]`);
        if (colCell) colCell.classList.add('highlighted');
    }
    
    // Highlight khối 3x3
    const blockStartRow = Math.floor(row / 3) * 3;
    const blockStartCol = Math.floor(col / 3) * 3;
    
    for (let i = blockStartRow; i < blockStartRow + 3; i++) {
        for (let j = blockStartCol; j < blockStartCol + 3; j++) {
            const blockCell = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
            if (blockCell) blockCell.classList.add('highlighted');
        }
    }
}

/**
 * Highlight các ô có cùng số
 */
function highlightSameNumbers(number) {
    document.querySelectorAll('.sudoku-cell').forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (gameState.board[row][col] === number) {
            cell.classList.add('same-number');
        }
    });
}

/**
 * Nhập số vào ô được chọn
 */
async function inputNumber(number) {
    if (!gameState.selectedCell || gameState.isPaused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Không thể sửa ô ban đầu
    if (gameState.originalBoard[row][col] !== 0) return;
    
    // Lưu trạng thái để hoàn tác
    saveStateForUndo();
    
    if (gameState.isNoteMode) {
        // Chế độ ghi chú
        await handleNoteInput(row, col, number);
    } else {
        // Chế độ nhập số thường
        await handleNumberInput(row, col, number);
    }
    
    // Cập nhật giao diện
    updateBoard();
    updateNumberPad();
    updateGameInfo();
    
    // Kiểm tra hoàn thành
    await checkGameComplete();
}

/**
 * Xử lý nhập số thường
 */
async function handleNumberInput(row, col, number) {
    try {
        // Kiểm tra tính hợp lệ
        const response = await fetch(`${API_BASE}/validate-move`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board: gameState.board,
                row: row,
                col: col,
                num: number
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.valid) {
                // Nước đi hợp lệ
                gameState.board[row][col] = number;
                
                // Xóa ghi chú của ô này
                const cellKey = `${row}-${col}`;
                if (gameState.cellNotes[cellKey]) {
                    delete gameState.cellNotes[cellKey];
                }
                
                // Tính điểm
                calculateScore();
            } else {
                // Nước đi không hợp lệ
                gameState.board[row][col] = number; // Vẫn điền số để hiển thị lỗi
                gameState.errors++;
                
                // Kiểm tra thua
                if (gameState.errors >= gameState.maxErrors) {
                    await handleGameLoss();
                }
            }
        }
    } catch (error) {
        console.error('Lỗi kiểm tra nước đi:', error);
    }
}

/**
 * Xử lý nhập ghi chú
 */
async function handleNoteInput(row, col, number) {
    // Không thể ghi chú vào ô đã có số
    if (gameState.board[row][col] !== 0) return;
    
    try {
        // Kiểm tra ghi chú có hợp lệ không
        const response = await fetch(`${API_BASE}/validate-note`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board: gameState.board,
                row: row,
                col: col,
                num: number
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.valid) {
            const cellKey = `${row}-${col}`;
            
            if (!gameState.cellNotes[cellKey]) {
                gameState.cellNotes[cellKey] = new Set();
            }
            
            // Toggle ghi chú
            if (gameState.cellNotes[cellKey].has(number)) {
                gameState.cellNotes[cellKey].delete(number);
            } else {
                gameState.cellNotes[cellKey].add(number);
            }
            
            // Nếu set rỗng thì xóa
            if (gameState.cellNotes[cellKey].size === 0) {
                delete gameState.cellNotes[cellKey];
            }
        }
    } catch (error) {
        console.error('Lỗi kiểm tra ghi chú:', error);
    }
}

/**
 * Cập nhật hiển thị bảng
 */
function updateBoard() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cellIndex = row * 9 + col;
            const cell = document.querySelector(`[data-index="${cellIndex}"]`);
            
            if (cell) {
                const value = gameState.board[row][col];
                const isOriginal = gameState.originalBoard[row][col] !== 0;
                const cellKey = `${row}-${col}`;
                
                // Reset classes
                cell.className = 'sudoku-cell';
                
                // Thêm class tương ứng
                if (isOriginal) {
                    cell.classList.add('fixed');
                }
                
                // Kiểm tra lỗi
                if (value !== 0 && !isOriginal) {
                    if (!isValidMove(row, col, value)) {
                        cell.classList.add('error');
                    }
                }
                
                // Hiển thị số hoặc ghi chú
                if (value !== 0) {
                    cell.textContent = value;
                    cell.innerHTML = value; // Xóa ghi chú nếu có
                } else if (gameState.cellNotes[cellKey] && gameState.cellNotes[cellKey].size > 0) {
                    // Hiển thị ghi chú
                    displayNotes(cell, gameState.cellNotes[cellKey]);
                } else {
                    cell.textContent = '';
                    cell.innerHTML = '';
                }
            }
        }
    }
}

/**
 * Hiển thị ghi chú trong ô
 */
function displayNotes(cell, notes) {
    const notesArray = Array.from(notes).sort();
    const notesGrid = document.createElement('div');
    notesGrid.className = 'cell-notes';
    
    for (let i = 1; i <= 9; i++) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        
        if (notesArray.includes(i)) {
            noteItem.textContent = i;
        }
        
        notesGrid.appendChild(noteItem);
    }
    
    cell.innerHTML = '';
    cell.appendChild(notesGrid);
}

/**
 * Kiểm tra nước đi có hợp lệ không (client-side)
 */
function isValidMove(row, col, num) {
    // Kiểm tra hàng
    for (let j = 0; j < 9; j++) {
        if (j !== col && gameState.board[row][j] === num) {
            return false;
        }
    }
    
    // Kiểm tra cột
    for (let i = 0; i < 9; i++) {
        if (i !== row && gameState.board[i][col] === num) {
            return false;
        }
    }
    
    // Kiểm tra khối 3x3
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    
    for (let i = startRow; i < startRow + 3; i++) {
        for (let j = startCol; j < startCol + 3; j++) {
            if ((i !== row || j !== col) && gameState.board[i][j] === num) {
                return false;
            }
        }
    }
    
    return true;
}

/**
 * Cập nhật số lượng còn lại của từng số
 */
function updateNumberPad() {
    const numberCounts = {};
    
    // Đếm số lượng từng số trên bảng
    for (let i = 1; i <= 9; i++) {
        numberCounts[i] = 0;
    }
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const value = gameState.board[row][col];
            if (value !== 0) {
                numberCounts[value]++;
            }
        }
    }
    
    // Cập nhật hiển thị
    for (let i = 1; i <= 9; i++) {
        const remaining = 9 - numberCounts[i];
        const remainingElement = document.getElementById(`remaining-${i}`);
        
        if (remainingElement) {
            remainingElement.textContent = remaining;
        }
        
        // Disable button nếu đã đủ 9 số
        const button = document.querySelector(`[data-number="${i}"]`);
        if (button) {
            button.disabled = remaining === 0;
            button.style.opacity = remaining === 0 ? '0.5' : '1';
        }
    }
}

/**
 * Cập nhật thông tin game
 */
function updateGameInfo() {
    elements.displays.score.textContent = gameState.score;
    elements.displays.errors.textContent = `${gameState.errors}/${gameState.maxErrors}`;
    elements.displays.difficulty.textContent = getDifficultyText(gameState.difficulty);
    elements.displays.hintsCount.textContent = gameState.hintsRemaining;
    
    // Cập nhật màu errors
    if (gameState.errors >= gameState.maxErrors - 1) {
        elements.displays.errors.style.color = 'var(--danger-color)';
    } else {
        elements.displays.errors.style.color = 'var(--text-primary)';
    }
}

/**
 * Lấy text mức độ
 */
function getDifficultyText(difficulty) {
    const texts = {
        'easy': 'Dễ',
        'medium': 'Trung bình',
        'hard': 'Khó'
    };
    return texts[difficulty] || 'Không xác định';
}

/**
 * Bắt đầu đếm thời gian
 */
function startTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            updateTimeDisplay();
        }
    }, 1000);
}

/**
 * Cập nhật hiển thị thời gian
 */
function updateTimeDisplay() {
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = gameState.elapsedTime % 60;
    elements.displays.time.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Tiếp tục phần còn lại...
/**
 * Tạm dừng/tiếp tục game
 */
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    
    if (gameState.isPaused) {
        elements.containers.pausedOverlay.style.display = 'flex';
        elements.buttons.pause.innerHTML = '<span>▶️</span>';
        elements.buttons.pause.title = 'Tiếp tục';
    } else {
        elements.containers.pausedOverlay.style.display = 'none';
        elements.buttons.pause.innerHTML = '<span>⏸️</span>';
        elements.buttons.pause.title = 'Tạm dừng';
    }
}

/**
 * Đổi giao diện sáng/tối
 */
function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    
    if (isDark) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        elements.buttons.themeToggle.innerHTML = '<span>🌙</span>';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        elements.buttons.themeToggle.innerHTML = '<span>☀️</span>';
        localStorage.setItem('theme', 'dark');
    }
}

/**
 * Tải theme đã lưu
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(savedTheme + '-theme');
    
    if (savedTheme === 'dark') {
        elements.buttons.themeToggle.innerHTML = '<span>☀️</span>';
    } else {
        elements.buttons.themeToggle.innerHTML = '<span>🌙</span>';
    }
}

/**
 * Lưu trạng thái để hoàn tác
 */
function saveStateForUndo() {
    const state = {
        board: JSON.parse(JSON.stringify(gameState.board)),
        cellNotes: JSON.parse(JSON.stringify(gameState.cellNotes)),
        errors: gameState.errors,
        score: gameState.score
    };
    
    gameState.gameHistory.push(state);
    
    // Giới hạn lịch sử 20 bước
    if (gameState.gameHistory.length > 20) {
        gameState.gameHistory.shift();
    }
}

/**
 * Hoàn tác nước đi
 */
function undoMove() {
    if (gameState.gameHistory.length === 0 || gameState.isPaused) return;
    
    const previousState = gameState.gameHistory.pop();
    gameState.board = previousState.board;
    gameState.cellNotes = previousState.cellNotes;
    gameState.errors = previousState.errors;
    gameState.score = previousState.score;
    
    updateBoard();
    updateNumberPad();
    updateGameInfo();
}

/**
 * Xóa ô được chọn
 */
function eraseCell() {
    if (!gameState.selectedCell || gameState.isPaused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Không thể xóa ô ban đầu
    if (gameState.originalBoard[row][col] !== 0) return;
    
    // Chỉ xóa được ô sai
    if (gameState.board[row][col] !== 0 && !isValidMove(row, col, gameState.board[row][col])) {
        saveStateForUndo();
        gameState.board[row][col] = 0;
        
        updateBoard();
        updateNumberPad();
        updateGameInfo();
    }
}

/**
 * Bật/tắt chế độ ghi chú
 */
function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    
    if (gameState.isNoteMode) {
        elements.buttons.note.classList.add('active');
    } else {
        elements.buttons.note.classList.remove('active');
    }
}

/**
 * Lấy gợi ý
 */
async function getHint() {
    if (!gameState.selectedCell || gameState.hintsRemaining <= 0 || gameState.isPaused) return;
    
    const { row, col } = gameState.selectedCell;
    
    // Không thể gợi ý cho ô đã có số
    if (gameState.board[row][col] !== 0) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/get-hint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board: gameState.board,
                row: row,
                col: col
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.hint) {
            saveStateForUndo();
            
            gameState.board[row][col] = data.hint;
            gameState.hintsRemaining--;
            
            // Xóa ghi chú của ô này
            const cellKey = `${row}-${col}`;
            if (gameState.cellNotes[cellKey]) {
                delete gameState.cellNotes[cellKey];
            }
            
            calculateScore();
            updateBoard();
            updateNumberPad();
            updateGameInfo();
            
            await checkGameComplete();
        } else {
            showError('Không thể lấy gợi ý cho ô này');
        }
    } catch (error) {
        console.error('Lỗi lấy gợi ý:', error);
        showError('Lỗi kết nối server');
    } finally {
        showLoading(false);
    }
}

/**
 * Giải toàn bộ puzzle
 */
async function solvePuzzle() {
    if (gameState.isPaused) return;
    
    const confirmed = confirm('Bạn có chắc muốn giải toàn bộ puzzle? Điểm số sẽ được đặt lại về 0.');
    if (!confirmed) return;
    
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/solve-puzzle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board: gameState.board
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.solution) {
            saveStateForUndo();
            
            gameState.board = data.solution;
            gameState.score = 0;
            gameState.cellNotes = {}; // Xóa tất cả ghi chú
            
            updateBoard();
            updateNumberPad();
            updateGameInfo();
            
            await checkGameComplete();
        } else {
            showError('Không thể giải puzzle này');
        }
    } catch (error) {
        console.error('Lỗi giải puzzle:', error);
        showError('Lỗi kết nối server');
    } finally {
        showLoading(false);
    }
}

/**
 * Tính điểm
 */
function calculateScore() {
    const baseScores = {
        'easy': 10,
        'medium': 15,
        'hard': 20
    };
    
    const pointsPerCell = baseScores[gameState.difficulty] || 10;
    
    // Tính số ô đã điền đúng
    let correctCells = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (gameState.board[row][col] !== 0 && isValidMove(row, col, gameState.board[row][col])) {
                correctCells++;
            }
        }
    }
    
    gameState.score = correctCells * pointsPerCell;
}

/**
 * Kiểm tra game hoàn thành
 */
async function checkGameComplete() {
    try {
        const response = await fetch(`${API_BASE}/check-complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                board: gameState.board
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.complete && data.valid) {
            await handleGameWin();
        }
    } catch (error) {
        console.error('Lỗi kiểm tra hoàn thành:', error);
    }
}

/**
 * Xử lý thắng game
 */
async function handleGameWin() {
    // Dừng timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Tính điểm cuối
    calculateScore();
    
    try {
        // Lưu điểm
        const response = await fetch(`${API_BASE}/save-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                difficulty: gameState.difficulty,
                time: gameState.elapsedTime,
                errors: gameState.errors
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            gameState.score = data.score;
        }
    } catch (error) {
        console.error('Lỗi lưu điểm:', error);
    }
    
    // Hiển thị modal thắng
    showGameOverModal(true);
}

/**
 * Xử lý thua game
 */
async function handleGameLoss() {
    // Dừng timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Hiển thị modal thua
    showGameOverModal(false);
}

/**
 * Hiển thị modal game over
 */
function showGameOverModal(isWin) {
    const modal = elements.modals.gameOver;
    const title = document.getElementById('game-over-title');
    const content = document.getElementById('game-over-content');
    
    if (isWin) {
        title.textContent = 'Chúc mừng!';
        title.style.color = 'var(--success-color)';
        
        content.innerHTML = `
            <h3>Bạn đã hoàn thành puzzle!</h3>
            <div class="game-over-stats">
                <div class="stat-item">
                    <span class="stat-label">Mức độ:</span>
                    <span class="stat-value">${getDifficultyText(gameState.difficulty)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Thời gian:</span>
                    <span class="stat-value">${formatTime(gameState.elapsedTime)}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Lỗi:</span>
                    <span class="stat-value">${gameState.errors}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Điểm số:</span>
                    <span class="stat-value">${gameState.score}</span>
                </div>
            </div>
        `;
    } else {
        title.textContent = 'Game Over';
        title.style.color = 'var(--danger-color)';
        
        content.innerHTML = `
            <h3>Bạn đã mắc quá nhiều lỗi!</h3>
            <div class="game-over-stats">
                <div class="stat-item">
                    <span class="stat-label">Lỗi:</span>
                    <span class="stat-value">${gameState.errors}/${gameState.maxErrors}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Thời gian:</span>
                    <span class="stat-value">${formatTime(gameState.elapsedTime)}</span>
                </div>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

/**
 * Chơi lại game hiện tại
 */
function retryGame() {
    // Reset board về trạng thái ban đầu
    gameState.board = JSON.parse(JSON.stringify(gameState.originalBoard));
    gameState.selectedCell = null;
    gameState.startTime = Date.now();
    gameState.elapsedTime = 0;
    gameState.isPaused = false;
    gameState.errors = 0;
    gameState.hintsRemaining = 3;
    gameState.score = 0;
    gameState.gameHistory = [];
    gameState.cellNotes = {};
    
    // Cập nhật giao diện
    updateBoard();
    updateNumberPad();
    updateGameInfo();
    startTimer();
}

/**
 * Format thời gian
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Hiển thị modal luật chơi
 */
function showRulesModal() {
    elements.modals.rules.classList.add('active');
}

/**
 * Hiển thị modal bảng điểm
 */
async function showScoresModal() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE}/get-scores`);
        const data = await response.json();
        
        if (data.success) {
            displayScores(data.scores);
            elements.modals.scores.classList.add('active');
        } else {
            showError('Không thể tải bảng điểm');
        }
    } catch (error) {
        console.error('Lỗi tải bảng điểm:', error);
        showError('Lỗi kết nối server');
    } finally {
        showLoading(false);
    }
}

/**
 * Hiển thị bảng điểm
 */
function displayScores(scores) {
    const content = document.getElementById('scores-content');
    content.innerHTML = '';
    
    const difficulties = ['easy', 'medium', 'hard'];
    const difficultyNames = {
        'easy': 'Dễ',
        'medium': 'Trung bình',
        'hard': 'Khó'
    };
    
    difficulties.forEach(difficulty => {
        const difficultyDiv = document.createElement('div');
        difficultyDiv.className = 'difficulty-scores';
        
        const title = document.createElement('h3');
        title.textContent = difficultyNames[difficulty];
        difficultyDiv.appendChild(title);
        
        if (scores[difficulty] && scores[difficulty].length > 0) {
            const table = document.createElement('table');
            table.className = 'scores-table';
            
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Hạng</th>
                        <th>Điểm</th>
                        <th>Thời gian</th>
                        <th>Ngày</th>
                    </tr>
                </thead>
                <tbody>
                    ${scores[difficulty].map((score, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${score.score}</td>
                            <td>${formatTime(score.time)}</td>
                            <td>${new Date(score.date).toLocaleDateString('vi-VN')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            difficultyDiv.appendChild(table);
        } else {
            const noScores = document.createElement('div');
            noScores.className = 'no-scores';
            noScores.textContent = 'Chưa có điểm số nào';
            difficultyDiv.appendChild(noScores);
        }
        
        content.appendChild(difficultyDiv);
    });
}

/**
 * Đóng tất cả modal
 */
function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

/**
 * Hiển thị/ẩn loading
 */
function showLoading(show) {
    elements.modals.loading.style.display = show ? 'flex' : 'none';
}

/**
 * Hiển thị thông báo lỗi
 */
function showError(message) {
    alert('Lỗi: ' + message);
}

/**
 * Thoát ứng dụng
 */
function exitApp() {
    const { ipcRenderer } = require('electron');
    ipcRenderer.invoke('quit-app');
}