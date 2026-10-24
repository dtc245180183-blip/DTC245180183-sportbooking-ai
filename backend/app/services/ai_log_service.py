import json
from sqlalchemy.orm import Session
from app.models.ai_log import AILog

def save_log(db: Session, log_type: str, input_data: dict, output_text: str):
    """
    Lưu log AI xuống database.
    Việc này được tách biệt với gemini_client để rành mạch logic gọi AI và lưu trữ.
    """
    try:
        input_json_str = json.dumps(input_data, ensure_ascii=False)
        new_log = AILog(
            type=log_type,
            input_json=input_json_str,
            output_text=output_text
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        db.rollback()
        # Trong thực tế có thể log ra console/file, 
        # nhưng thường không muốn crash cả flow chính chỉ vì lưu log AI thất bại.
        print(f"Warning: Failed to save AI log - {e}")
