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
    
    def solve_multiple_solutions(self, board, max_solutions=2):
        """
        Tìm nhiều giải pháp để kiểm tra tính duy nhất
        """
        solutions = []
        board_copy = copy.deepcopy(board)
        self._find_all_solutions(board_copy, solutions, max_solutions)
        return solutions
    
    def _find_all_solutions(self, board, solutions, max_solutions):
        """
        Tìm tất cả các giải pháp (helper function)
        """
        if len(solutions) >= max_solutions:
            return
        
        empty_cell = self.find_best_empty_cell(board)
        if empty_cell is None:
            solutions.append(copy.deepcopy(board))
            return
        
        row, col = empty_cell
        valid_numbers = self.get_valid_numbers(board, row, col)
        
        for num in valid_numbers:
            board[row][col] = num
            self._find_all_solutions(board, solutions, max_solutions)
            board[row][col] = 0
    
    def get_hint(self, board, row, col):
        """
        Lấy gợi ý cho ô tại vị trí (row, col) với thuật toán linh hoạt
        """
        if board[row][col] != 0:
            return None
        
        # Lấy các số hợp lệ có thể điền vào ô này
        valid_numbers = self.get_valid_numbers(board, row, col)
        if not valid_numbers:
            return None
        
        # Thử từng số hợp lệ và xem số nào dẫn đến solution
        for num in valid_numbers:
            temp_board = copy.deepcopy(board)
            temp_board[row][col] = num
            
            # Kiểm tra xem có thể giải được từ trạng thái này không
            if self.solve(temp_board):
                return num
        
        # Nếu không tìm được số nào có thể dẫn đến solution
        # Trả về số đầu tiên trong danh sách hợp lệ
        return valid_numbers[0] if valid_numbers else None
    
    def get_smart_hint(self, board, row, col):
        """
        Lấy gợi ý thông minh - ưu tiên số có ít conflict nhất
        """
        if board[row][col] != 0:
            return None
        
        valid_numbers = self.get_valid_numbers(board, row, col)
        if not valid_numbers:
            return None
        
        # Đánh giá từng số dựa trên số lượng lựa chọn còn lại của các ô khác
        best_num = None
        max_remaining_options = -1
        
        for num in valid_numbers:
            temp_board = copy.deepcopy(board)
            temp_board[row][col] = num
            
            # Đếm tổng số lựa chọn còn lại của tất cả ô trống
            total_options = 0
            for i in range(9):
                for j in range(9):
                    if temp_board[i][j] == 0:
                        total_options += len(self.get_valid_numbers(temp_board, i, j))
            
            if total_options > max_remaining_options:
                max_remaining_options = total_options
                best_num = num
        
        return best_num
    
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