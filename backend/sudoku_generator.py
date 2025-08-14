import random
import copy
from sudoku_solver import SudokuSolver

class SudokuGenerator:
    """
    Lớp tạo bài Sudoku với các mức độ khác nhau
    """
    
    def __init__(self):
        self.board = [[0 for _ in range(9)] for _ in range(9)]
        self.solver = SudokuSolver()  # Sử dụng solver để tránh trùng lặp code
    
    def fill_board_randomly(self, board):
        """
        Điền bảng Sudoku ngẫu nhiên bằng thuật toán vét cạn (backtracking)
        """
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    numbers = list(range(1, 10))
                    random.shuffle(numbers)  # Tạo tính ngẫu nhiên
                    
                    for num in numbers:
                        if self.solver.is_valid(board, i, j, num):
                            board[i][j] = num
                            if self.fill_board_randomly(board):
                                return True
                            board[i][j] = 0
                    return False
        return True
    
    def generate_complete_board(self):
        """
        Tạo bảng Sudoku hoàn chỉnh
        """
        self.board = [[0 for _ in range(9)] for _ in range(9)]
        self.fill_board_randomly(self.board)
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