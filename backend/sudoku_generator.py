import random
import copy

class SudokuGenerator:
    """
    Lớp tạo bài Sudoku với các mức độ khác nhau
    """
    
    def __init__(self):
        self.board = [[0 for _ in range(9)] for _ in range(9)]
    
    def is_valid(self, board, row, col, num):
        """
        Kiểm tra số num có hợp lệ tại vị trí (row, col) không
        """
        # Kiểm tra hàng
        for j in range(9):
            if board[row][j] == num:
                return False
        
        # Kiểm tra cột
        for i in range(9):
            if board[i][col] == num:
                return False
        
        # Kiểm tra khối 3x3
        start_row = (row // 3) * 3
        start_col = (col // 3) * 3
        for i in range(start_row, start_row + 3):
            for j in range(start_col, start_col + 3):
                if board[i][j] == num:
                    return False
        
        return True
    
    def solve_sudoku(self, board):
        """
        Giải Sudoku bằng thuật toán vét cạn (backtracking)
        """
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    numbers = list(range(1, 10))
                    random.shuffle(numbers)  # Tạo tính ngẫu nhiên
                    
                    for num in numbers:
                        if self.is_valid(board, i, j, num):
                            board[i][j] = num
                            if self.solve_sudoku(board):
                                return True
                            board[i][j] = 0
                    return False
        return True
    
    def generate_complete_board(self):
        """
        Tạo bảng Sudoku hoàn chỉnh
        """
        self.board = [[0 for _ in range(9)] for _ in range(9)]
        self.solve_sudoku(self.board)
        return copy.deepcopy(self.board)
    
    def remove_numbers(self, board, difficulty):
        """
        Xóa các số để tạo bài tập theo mức độ
        - Dễ: 40-45 ô trống
        - Trung bình: 46-50 ô trống  
        - Khó: 51-55 ô trống
        """
        difficulty_levels = {
            'easy': (40, 45),
            'medium': (46, 50),
            'hard': (51, 55)
        }
        
        min_remove, max_remove = difficulty_levels[difficulty]
        remove_count = random.randint(min_remove, max_remove)
        
        puzzle = copy.deepcopy(board)
        cells = [(i, j) for i in range(9) for j in range(9)]
        random.shuffle(cells)
        
        for i in range(remove_count):
            row, col = cells[i]
            puzzle[row][col] = 0
        
        return puzzle
    
    def generate_puzzle(self, difficulty='medium'):
        """
        Tạo bài Sudoku với mức độ chỉ định
        """
        complete_board = self.generate_complete_board()
        puzzle = self.remove_numbers(complete_board, difficulty)
        
        return {
            'puzzle': puzzle,
            'solution': complete_board
        }