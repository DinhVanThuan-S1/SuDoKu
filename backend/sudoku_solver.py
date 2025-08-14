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
        Giải Sudoku bằng thuật toán vét cạn với tối ưu hóa
        """
        # Tìm ô trống có ít lựa chọn nhất (Most Constrained Variable)
        empty_cell = self.find_best_empty_cell(board)
        if empty_cell is None:
            return True  # Đã điền đầy
        
        row, col = empty_cell
        # Lấy danh sách số hợp lệ và thử theo thứ tự ngẫu nhiên để tăng tính linh hoạt
        valid_numbers = self.get_valid_numbers(board, row, col)
        
        for num in valid_numbers:
            board[row][col] = num
            if self.solve(board):
                return True
            board[row][col] = 0
        
        return False
    
    def find_best_empty_cell(self, board):
        """
        Tìm ô trống có ít lựa chọn nhất để tối ưu hóa backtracking
        """
        best_cell = None
        min_options = 10
        
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    valid_count = len(self.get_valid_numbers(board, i, j))
                    if valid_count < min_options:
                        min_options = valid_count
                        best_cell = (i, j)
                        # Nếu tìm thấy ô chỉ có 1 lựa chọn, ưu tiên điền ngay
                        if min_options == 1:
                            return best_cell
        
        return best_cell
    
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