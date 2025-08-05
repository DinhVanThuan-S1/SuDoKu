from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import copy

from sudoku_generator import SudokuGenerator
from sudoku_solver import SudokuSolver
from game_state import GameState

app = Flask(__name__)
CORS(app)  # Cho phép Electron truy cập

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
        
        hint = solver.get_hint(board, row, col)
        
        return jsonify({
            'success': True,
            'hint': hint
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/solve-puzzle', methods=['POST'])
def solve_puzzle():
    """
    Giải toàn bộ puzzle
    """
    try:
        data = request.json
        board = copy.deepcopy(data['board'])
        
        if solver.solve(board):
            return jsonify({
                'success': True,
                'solution': board
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Không thể giải puzzle này'
            })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

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