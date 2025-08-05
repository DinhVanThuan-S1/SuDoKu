from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import copy

from sudoku_generator import SudokuGenerator
from sudoku_solver import SudokuSolver
from game_state import GameState

app = Flask(__name__)
CORS(app)  # Cho phép Electron truy cập

@app.route("/")
def home():
    return "Hello World!"

# Khởi tạo các đối tượng
generator = SudokuGenerator()
solver = SudokuSolver()
game_state = GameState()

@app.route('/api/new-game', methods=['POST'])
def new_game():
    """
    Tạo game mới với mức độ chỉ định
    """
    try:
        data = request.json
        difficulty = data.get('difficulty', 'medium')
        
        puzzle_data = generator.generate_puzzle(difficulty)
        
        response = {
            'success': True,
            'puzzle': puzzle_data['puzzle'],
            'original_puzzle': copy.deepcopy(puzzle_data['puzzle']),
            'solution': puzzle_data['solution'],
            'difficulty': difficulty
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/validate-move', methods=['POST'])
def validate_move():
    """
    Kiểm tra nước đi có hợp lệ không
    """
    try:
        data = request.json
        board = data['board']
        row = data['row']
        col = data['col']
        num = data['num']
        
        is_valid = solver.is_valid(board, row, col, num)
        
        return jsonify({
            'success': True,
            'valid': is_valid
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get-hint', methods=['POST'])
def get_hint():
    """
    Lấy gợi ý cho ô được chỉ định
    """
    try:
        data = request.json
        board = data['board']
        row = data['row']
        col = data['col']
        
        # Kiểm tra ô có trống không
        if board[row][col] != 0:
            return jsonify({
                'success': False,
                'error': 'Ô này đã có số'
            })
        
        # Kiểm tra board có hợp lệ không
        if not solver.is_valid_board(board):
            return jsonify({
                'success': False,
                'error': 'Trạng thái bảng không hợp lệ'
            })
        
        # Thử gợi ý thông minh trước
        hint = solver.get_smart_hint(board, row, col)
        
        # Nếu không có gợi ý thông minh, thử gợi ý thường
        if hint is None:
            hint = solver.get_hint(board, row, col)
        
        if hint is not None:
            return jsonify({
                'success': True,
                'hint': hint
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Không thể tìm gợi ý cho ô này'
            })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f'Lỗi server: {str(e)}'})

@app.route('/api/solve-puzzle', methods=['POST'])
def solve_puzzle():
    """
    Giải toàn bộ puzzle
    """
    try:
        data = request.json
        board = copy.deepcopy(data['board'])
        
        # Kiểm tra board có hợp lệ không
        if not solver.is_valid_board(board):
            return jsonify({
                'success': False,
                'error': 'Trạng thái bảng không hợp lệ - có số trùng lặp'
            })
        
        # Lưu board gốc để so sánh
        original_board = copy.deepcopy(board)
        
        # Thử giải puzzle
        if solver.solve(board):
            # Kiểm tra solution có hợp lệ không
            if solver.is_valid_board(board) and solver.is_complete(board):
                return jsonify({
                    'success': True,
                    'solution': board
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Solution tạo ra không hợp lệ'
                })
        else:
            # Nếu không giải được, thử tìm hiểu nguyên nhân
            empty_cells = []
            for i in range(9):
                for j in range(9):
                    if original_board[i][j] == 0:
                        if not solver.get_valid_numbers(original_board, i, j):
                            empty_cells.append(f"({i+1},{j+1})")
            
            if empty_cells:
                return jsonify({
                    'success': False,
                    'error': f'Không thể giải - các ô sau không có số hợp lệ: {", ".join(empty_cells)}'
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'Không thể giải puzzle này với trạng thái hiện tại'
                })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f'Lỗi server: {str(e)}'})

@app.route('/api/validate-note', methods=['POST'])
def validate_note():
    """
    Kiểm tra ghi chú có hợp lệ không
    """
    try:
        data = request.json
        board = data['board']
        row = data['row']
        col = data['col']
        num = data['num']
        
        is_valid = solver.is_valid(board, row, col, num)
        
        return jsonify({
            'success': True,
            'valid': is_valid
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/check-solvable', methods=['POST'])
def check_solvable():
    """
    Kiểm tra xem puzzle có giải được không
    """
    try:
        data = request.json
        board = copy.deepcopy(data['board'])
        
        # Kiểm tra board có hợp lệ không
        if not solver.is_valid_board(board):
            return jsonify({
                'success': True,
                'solvable': False,
                'reason': 'Trạng thái bảng không hợp lệ'
            })
        
        # Thử giải
        if solver.solve(board):
            return jsonify({
                'success': True,
                'solvable': True,
                'reason': 'Puzzle có thể giải được'
            })
        else:
            return jsonify({
                'success': True,
                'solvable': False,
                'reason': 'Puzzle không có solution với trạng thái hiện tại'
            })
    
    except Exception as e:
        return jsonify({'success': False, 'error': f'Lỗi server: {str(e)}'})

@app.route('/api/save-game', methods=['POST'])
def save_game():
    """
    Lưu trạng thái game
    """
    try:
        data = request.json
        success = game_state.save_game(data)
        
        return jsonify({
            'success': success
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/load-game', methods=['GET'])
def load_game():
    """
    Tải trạng thái game đã lưu
    """
    try:
        saved_game = game_state.load_game()
        
        return jsonify({
            'success': True,
            'game_data': saved_game
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/save-score', methods=['POST'])
def save_score():
    """
    Lưu điểm số
    """
    try:
        data = request.json
        difficulty = data['difficulty']
        time_seconds = data['time']
        errors = data.get('errors', 0)
        
        score = game_state.calculate_score(time_seconds, difficulty, errors)
        success = game_state.save_score(difficulty, time_seconds, score)
        
        return jsonify({
            'success': success,
            'score': score
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get-scores', methods=['GET'])
def get_scores():
    """
    Lấy danh sách điểm cao
    """
    try:
        scores = game_state.load_scores()
        
        return jsonify({
            'success': True,
            'scores': scores
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/check-complete', methods=['POST'])
def check_complete():
    """
    Kiểm tra puzzle đã hoàn thành chưa
    """
    try:
        data = request.json
        board = data['board']
        
        is_complete = solver.is_complete(board)
        is_valid = solver.is_valid_board(board) if is_complete else True
        
        return jsonify({
            'success': True,
            'complete': is_complete and is_valid,
            'valid': is_valid
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)