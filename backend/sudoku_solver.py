import copy

class SudokuSolver:
    """
    Lớp giải Sudoku sử dụng thuật toán vét cạn
    """
    
    def __init__(self):
        pass
    
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
    
    def solve(self, board):
        """
        Giải Sudoku bằng thuật toán vét cạn
        """
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    for num in range(1, 10):
                        if self.is_valid(board, i, j, num):
                            board[i][j] = num
                            if self.solve(board):
                                return True
                            board[i][j] = 0
                    return False
        return True
    
    def get_hint(self, board, row, col):
        """
        Lấy gợi ý cho ô tại vị trí (row, col)
        """
        if board[row][col] != 0:
            return None
        
        temp_board = copy.deepcopy(board)
        if self.solve(temp_board):
            return temp_board[row][col]
        return None
    
    def get_valid_numbers(self, board, row, col):
        """
        Lấy danh sách các số hợp lệ có thể điền vào ô (row, col)
        """
        if board[row][col] != 0:
            return []
        
        valid_numbers = []
        for num in range(1, 10):
            if self.is_valid(board, row, col, num):
                valid_numbers.append(num)
        
        return valid_numbers
    
    def is_complete(self, board):
        """
        Kiểm tra bảng đã hoàn thành chưa
        """
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    return False
        return True
    
    def is_valid_board(self, board):
        """
        Kiểm tra bảng có hợp lệ không (không có số trùng)
        """
        for i in range(9):
            for j in range(9):
                if board[i][j] != 0:
                    num = board[i][j]
                    board[i][j] = 0  # Tạm thời xóa để kiểm tra
                    if not self.is_valid(board, i, j, num):
                        board[i][j] = num  # Khôi phục
                        return False
                    board[i][j] = num  # Khôi phục
        return True