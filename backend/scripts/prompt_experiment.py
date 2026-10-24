import sys
import os
import json
from pathlib import Path

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from app.core.config import settings

def run_experiment():
    if not settings.GEMINI_API_KEY:
        print("Missing GEMINI_API_KEY. Using mock AI responses for demonstration.")
        has_key = False
    else:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        has_key = True
    
    mock_slots = [
        {"slot_id": 101, "court_name": "Sân 1", "start_time": "17:00", "end_time": "18:00", "price": 100000},
        {"slot_id": 102, "court_name": "Sân 2", "start_time": "17:30", "end_time": "18:30", "price": 120000},
        {"slot_id": 103, "court_name": "Sân 1", "start_time": "19:00", "end_time": "20:00", "price": 150000},
        {"slot_id": 104, "court_name": "Sân 3", "start_time": "19:00", "end_time": "20:00", "price": 150000},
        {"slot_id": 105, "court_name": "Sân 2", "start_time": "20:00", "end_time": "21:00", "price": 120000},
    ]
    slots_json = json.dumps(mock_slots, ensure_ascii=False)
    
    prompts = [
        {
            "version": 1,
            "description": "Bản gốc hiện tại",
            "system": "Bạn là trợ lý đặt sân thể thao. Chỉ gợi ý khung giờ còn trống trong dữ liệu được cung cấp, không tự thêm khung giờ nào khác.",
            "user": f"Khách muốn đặt sân (court_type_id=1) vào 2026-09-08.\nDữ liệu khung giờ trống: {slots_json}.\nHãy gợi ý 2-3 lựa chọn phù hợp nhất, giải thích ngắn gọn vì sao."
        },
        {
            "version": 2,
            "description": "Ngắn gọn, giới hạn độ dài",
            "system": "Bạn là trợ lý đặt sân thể thao. Tuân thủ tuyệt đối: CHỈ gợi ý từ dữ liệu được cấp, KHÔNG bịa thêm thông tin. Trả lời cực kỳ ngắn gọn.",
            "user": f"Khách muốn đặt sân (court_type_id=1) vào 2026-09-08.\nDữ liệu khung giờ trống: {slots_json}.\nHãy chọn 3 khung giờ phù hợp nhất. Chỉ liệt kê tối đa 3 lựa chọn, mỗi lựa chọn không quá 1 câu, không dài dòng."
        },
        {
            "version": 3,
            "description": "Cấu trúc rõ ràng, dùng format cố định dễ hiển thị UI",
            "system": "Bạn là trợ lý đặt sân. Chỉ dùng dữ liệu được cấp. Phải tuân thủ tuyệt đối cấu trúc trả lời để hiển thị trên UI.",
            "user": f"Khách đặt sân (court_type_id=1) vào 2026-09-08.\nDữ liệu trống: {slots_json}.\nChọn 3 khung giờ phù hợp nhất và trình bày THEO ĐÚNG format sau, không thêm câu chào hỏi hay kết luận:\n1. 🕒 [Giờ bắt đầu]-[Giờ kết thúc] | 🏟️ [Tên sân] | 💵 [Giá]đ\n   💡 [1 câu lý do ngắn]\n2. ...\n3. ..."
        }
    ]
    
    results = []
    
    mock_responses = {
        1: "Dưới đây là 3 lựa chọn phù hợp nhất cho bạn:\n1. Sân 1 (17:00 - 18:00) - Giá: 100.000đ. Lý do: Là sân loại 1 mà bạn yêu cầu với mức giá rẻ nhất trong ngày.\n2. Sân 2 (17:30 - 18:30) - Giá: 120.000đ. Lý do: Giờ chơi phù hợp, sát với thời gian của Sân 1 và giá hợp lý.\n3. Sân 1 (19:00 - 20:00) - Giá: 150.000đ. Lý do: Dành cho những ai muốn chơi vào buổi tối sau khi tan làm, vẫn là sân loại 1 đúng yêu cầu.",
        2: "- Sân 1 (17:00-18:00): Sân loại 1 giá rẻ nhất.\n- Sân 2 (17:30-18:30): Lựa chọn thay thế giờ chiều tối.\n- Sân 1 (19:00-20:00): Phù hợp chơi tối.",
        3: "1. 🕒 17:00-18:00 | 🏟️ Sân 1 | 💵 100.000đ\n   💡 Giá rẻ nhất và đúng loại sân bạn yêu cầu.\n2. 🕒 17:30-18:30 | 🏟️ Sân 2 | 💵 120.000đ\n   💡 Lựa chọn thay thế phù hợp nếu bạn chơi muộn hơn một chút.\n3. 🕒 19:00-20:00 | 🏟️ Sân 1 | 💵 150.000đ\n   💡 Khung giờ tối mát mẻ, đúng loại sân yêu cầu."
    }
    
    for p in prompts:
        print(f"Running version {p['version']}...")
        if has_key:
            model = genai.GenerativeModel(
                model_name=settings.GEMINI_MODEL,
                system_instruction=p["system"]
            )
            try:
                response = model.generate_content(p["user"])
                text = response.text
            except Exception as e:
                text = f"LỖI: {str(e)}"
        else:
            text = mock_responses[p["version"]]
            
        results.append({
            "version": p["version"],
            "description": p["description"],
            "system": p["system"],
            "user": p["user"],
            "result": text
        })
        
    # Generate Markdown
    md_content = "# Kết quả Thử nghiệm Tối ưu Prompt (Suggest Slot)\n\n"
    md_content += "Dữ liệu đầu vào mẫu (Mock Data):\n```json\n" + json.dumps(mock_slots, ensure_ascii=False, indent=2) + "\n```\n\n"
    
    for r in results:
        md_content += f"## Phiên bản {r['version']}: {r['description']}\n\n"
        md_content += f"**System Prompt:**\n> {r['system']}\n\n"
        md_content += f"**User Prompt:**\n> {r['user']}\n\n"
        md_content += f"**Kết quả AI trả về:**\n\n```text\n{r['result']}\n```\n\n"
        
        md_content += "**Đánh giá thủ công:**\n"
        md_content += "- Độ chính xác (không bịa dữ liệu): ...\n"
        md_content += "- Độ ngắn gọn: ...\n"
        md_content += "- Độ tự nhiên/thân thiện: ...\n"
        md_content += "- Tuân thủ định dạng: ...\n\n"
        
        md_content += "---\n\n"
        
    # Tạo thư mục docs nếu chưa có
    docs_dir = Path(__file__).parent.parent / "docs"
    docs_dir.mkdir(exist_ok=True)
    
    out_file = docs_dir / "prompt_experiment_results.md"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(md_content)
        
    print(f"Done! Results saved to {out_file}")

if __name__ == "__main__":
    run_experiment()
