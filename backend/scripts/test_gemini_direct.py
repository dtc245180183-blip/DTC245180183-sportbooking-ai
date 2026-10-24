import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL")

print(f"API key có tồn tại: {bool(api_key)}, độ dài: {len(api_key) if api_key else 0}")
print(f"Model đang dùng: {model_name}")

genai.configure(api_key=api_key)
model = genai.GenerativeModel(model_name)

try:
    response = model.generate_content("Xin chào, hãy trả lời đúng 1 câu ngắn để test kết nối.")
    print("THÀNH CÔNG. Phản hồi:", response.text)
except Exception as e:
    print("THẤT BẠI. Loại lỗi:", type(e).__name__)
    print("Chi tiết lỗi đầy đủ:", str(e))
