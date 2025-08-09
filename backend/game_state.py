import json
import os
from datetime import datetime

class GameState:
    """
    Lớp quản lý trạng thái game
    """
    
    def __init__(self):
        self.save_file = 'game_save.json'
        self.scores_file = 'scores.json'
    
    def save_game(self, game_data):
        """
        Lưu trạng thái game
        """
        try:
            with open(self.save_file, 'w', encoding='utf-8') as f:
                json.dump(game_data, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Lỗi khi lưu game: {e}")
            return False
    
    def load_game(self):
        """
        Tải trạng thái game đã lưu
        """
        try:
            if os.path.exists(self.save_file):
                with open(self.save_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return None
        except Exception as e:
            print(f"Lỗi khi tải game: {e}")
            return None
    
    def save_score(self, difficulty, time_seconds, score):
        """
        Lưu điểm số
        """
        try:
            scores = self.load_scores()
            
            score_entry = {
                'difficulty': difficulty,
                'time': time_seconds,
                'score': score,
                'date': datetime.now().isoformat()
            }
            
            if difficulty not in scores:
                scores[difficulty] = []
            
            scores[difficulty].append(score_entry)
            
            # Sắp xếp theo điểm từ cao xuống thấp
            scores[difficulty].sort(key=lambda x: x['score'], reverse=True)
            
            # Chỉ giữ lại 10 điểm cao nhất
            scores[difficulty] = scores[difficulty][:10]
            
            with open(self.scores_file, 'w', encoding='utf-8') as f:
                json.dump(scores, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            print(f"Lỗi khi lưu điểm: {e}")
            return False
    
    def load_scores(self):
        """
        Tải điểm số đã lưu
        """
        try:
            if os.path.exists(self.scores_file):
                with open(self.scores_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            print(f"Lỗi khi tải điểm: {e}")
            return {}
    
    def clear_saved_game(self):
        """
        Xóa trạng thái game đã lưu
        """
        try:
            if os.path.exists(self.save_file):
                os.remove(self.save_file)
            return True
        except Exception as e:
            print(f"Lỗi khi xóa game đã lưu: {e}")
            return False