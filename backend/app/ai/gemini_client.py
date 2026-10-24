import time
import logging
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, RetryError, InternalServerError, DeadlineExceeded
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cấu hình API Key 1 lần duy nhất lúc load module
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

def generate(system_prompt: str, user_prompt: str) -> str:
    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Cấu hình AI không hợp lệ: Thiếu GEMINI_API_KEY."
        )
        
    max_retries = 2
    retry_delays = [1, 2] # Tạm ngưng 1s, 2s cho các lần retry
    
    # Những lỗi nên retry (Timeout, Rate Limit, Server Error)
    RETRY_EXCEPTIONS = (ResourceExhausted, RetryError, InternalServerError, DeadlineExceeded, ConnectionError, TimeoutError)
    
    model = genai.GenerativeModel( # type: ignore
        model_name=settings.GEMINI_MODEL,
        system_instruction=system_prompt
    )
    
    for attempt in range(max_retries + 1):
        try:
            
            response = model.generate_content(user_prompt)
            
            # Kiểm tra Safety Filter khi truy cập text
            try:
                text = response.text
                if not text or not text.strip():
                    logger.error(f"Empty AI response for prompt: {user_prompt}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="AI không sinh được nội dung phù hợp, vui lòng thử lại"
                    )
                return text
            except ValueError as ve:
                logger.error(f"Gemini AI safety filter blocked content: {ve}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nội dung bị từ chối bởi bộ lọc an toàn của AI."
                )
                
        except HTTPException:
            # Re-raise nếu là HTTP Exception tự custom ở trên
            raise
        except RETRY_EXCEPTIONS as e:
            logger.error(f"Gemini API error (attempt {attempt + 1}): {e}")
            if attempt < max_retries:
                time.sleep(retry_delays[attempt])
                continue
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Dịch vụ AI hiện đang quá tải hoặc không thể kết nối, vui lòng thử lại sau."
                )
        except Exception as e:
            # Lỗi khác (ví dụ sai API key, model lỗi, request không hợp lệ) -> Không retry
            logger.error(f"Gemini API unexpected error: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Lỗi hệ thống AI (Internal Error). Vui lòng liên hệ admin."
            )

    raise RuntimeError("Unreachable")
