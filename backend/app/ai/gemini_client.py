import time
import logging
import google.generativeai as genai
from google.api_core.exceptions import (
    ResourceExhausted,
    RetryError,
    InternalServerError,
    DeadlineExceeded,
    NotFound,
    PermissionDenied,
    Unauthenticated,
    InvalidArgument,
)
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Cấu hình API Key 1 lần duy nhất lúc load module
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class GeminiCallContext:
    def __init__(self):
        self.model_used: str | None = None
        self.attempts: int = 0
        self.elapsed: float = 0.0
        self.error_type: str | None = None
        self.error_detail: str | None = None

def generate(system_prompt: str, user_prompt: str, timeout: float = 12.0, context: GeminiCallContext | None = None) -> str:
    """
    Gọi Google Gemini API sinh nội dung với cơ chế phân loại lỗi rõ ràng:
    - Phân biệt lỗi xác thực, lỗi model không tồn tại, hạn ngạch (429), timeout mạng, bộ lọc an toàn, lỗi response.
    - Tự động chuyển đổi giữa model chính và model phụ tương thích nếu gặp lỗi hạn ngạch (429) hoặc không tìm thấy model (404).
    - Giới hạn thời gian chờ an toàn và ghi log cấu trúc không in thông tin nhạy cảm.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("[AI_CONFIG_ERROR] Thiếu GEMINI_API_KEY trong cấu hình hệ thống.")
        if context:
            context.error_type = "LỖI_XÁC_THỰC"
            context.error_detail = "Cấu hình AI không hợp lệ: Thiếu GEMINI_API_KEY."
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
            detail="Cấu hình AI không hợp lệ: Thiếu GEMINI_API_KEY."
        )

    # Danh sách model ứng viên (ưu tiên model trong settings, dự phòng các model tương thích)
    candidate_models = [settings.GEMINI_MODEL]
    for backup_model in ["gemini-3.6-flash", "gemini-3.5-flash"]:
        if backup_model not in candidate_models:
            candidate_models.append(backup_model)

    attempts = 0
    total_start = time.time()
    last_error_type = "LỖI_HỆ_THỐNG"
    last_error_detail = "Dịch vụ AI hiện đang quá tải hoặc không thể kết nối, vui lòng thử lại sau."
    last_status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    for model_name in candidate_models:
        attempts += 1
        t0 = time.time()
        logger.info(f"[AI_CALL_START] Lần thử {attempts}: Model={model_name}, timeout={timeout}s")
        
        try:
            model = genai.GenerativeModel(  # type: ignore
                model_name=model_name,
                system_instruction=system_prompt
            )
            
            response = model.generate_content(user_prompt, request_options={"timeout": timeout})
            elapsed = time.time() - t0
            
            # Kiểm tra Safety Filter khi truy cập text
            try:
                text = response.text
                if not text or not text.strip():
                    logger.error(f"[AI_RESPONSE_EMPTY] Model {model_name} trả về nội dung rỗng trong {elapsed:.2f}s.")
                    last_error_type = "LỖI_RESPONSE"
                    if context:
                        context.attempts = attempts
                        context.elapsed = elapsed
                        context.error_type = "LỖI_RESPONSE"
                        context.error_detail = "AI không sinh được nội dung phù hợp, vui lòng thử lại."
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="AI không sinh được nội dung phù hợp, vui lòng thử lại."
                    )
                logger.info(f"[AI_CALL_SUCCESS] Model: {model_name}, Thời gian phản hồi: {elapsed:.2f}s, Lần thử: {attempts}.")
                if context:
                    context.model_used = model_name
                    context.attempts = attempts
                    context.elapsed = elapsed
                    context.error_type = None
                    context.error_detail = None
                return text
            except ValueError as ve:
                elapsed = time.time() - t0
                logger.error(f"[AI_SAFETY_BLOCKED] Bộ lọc an toàn kích hoạt: {ve}, Model: {model_name}, Thời gian: {elapsed:.2f}s")
                if context:
                    context.attempts = attempts
                    context.elapsed = elapsed
                    context.error_type = "LỖI_RESPONSE"
                    context.error_detail = "Nội dung bị từ chối bởi bộ lọc an toàn của AI."
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Nội dung bị từ chối bởi bộ lọc an toàn của AI."
                )

        except HTTPException:
            # Re-raise nếu là các mã lỗi 400 hoặc 502 đã phân loại
            raise
        except (PermissionDenied, Unauthenticated) as e:
            elapsed = time.time() - t0
            last_error_type = "LỖI_XÁC_THỰC"
            last_error_detail = "Lỗi xác thực Google AI API Key. Vui lòng kiểm tra quyền truy cập."
            logger.error(f"[AI_AUTH_ERROR] Lỗi xác thực/phân quyền API Key ({type(e).__name__}): {e}, Model: {model_name}, Thời gian: {elapsed:.2f}s")
            if context:
                context.attempts = attempts
                context.elapsed = time.time() - total_start
                context.error_type = last_error_type
                context.error_detail = last_error_detail
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=last_error_detail
            )
        except NotFound as e:
            elapsed = time.time() - t0
            last_error_type = "MODEL_KHÔNG_KHẢ_DỤNG"
            last_error_detail = f"Model AI {model_name} không khả dụng."
            last_status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            logger.warning(f"[AI_MODEL_NOT_FOUND] Model {model_name} không khả dụng ({type(e).__name__}): {e}, Thời gian: {elapsed:.2f}s. Thử model tiếp theo...")
            continue
        except ResourceExhausted as e:
            elapsed = time.time() - t0
            last_error_type = "GIỚI_HẠN_YÊU_CẦU_429"
            last_error_detail = f"Hạn ngạch model {model_name} đã vượt giới hạn (429 Quota Exceeded)."
            last_status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            logger.warning(f"[AI_RATE_LIMIT_429] Vượt quá hạn ngạch gọi model {model_name} (Free Tier Quota Exceeded), Thời gian: {elapsed:.2f}s. Thử model tiếp theo...")
            continue
        except (DeadlineExceeded, TimeoutError) as e:
            elapsed = time.time() - t0
            last_error_type = "TIMEOUT_MẠNG"
            last_error_detail = "Dịch vụ AI hiện đang quá tải hoặc không thể kết nối, vui lòng thử lại sau."
            last_status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            logger.warning(f"[AI_TIMEOUT_EXCEEDED] Quá thời gian chờ phản hồi ({timeout}s) với model {model_name} ({type(e).__name__}), Thời gian: {elapsed:.2f}s.")
            continue
        except (InternalServerError, RetryError, ConnectionError) as e:
            elapsed = time.time() - t0
            last_error_type = "LỖI_KẾT_NỐI_MÁY_CHỦ"
            last_error_detail = "Dịch vụ AI hiện đang quá tải hoặc không thể kết nối, vui lòng thử lại sau."
            last_status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            logger.warning(f"[AI_NETWORK_SERVER_ERROR] Lỗi kết nối máy chủ Google AI ({type(e).__name__}): {e}, Model: {model_name}, Thời gian: {elapsed:.2f}s.")
            continue
        except Exception as e:
            elapsed = time.time() - t0
            last_error_type = "LỖI_BẤT_NGỜ"
            last_error_detail = f"Lỗi hệ thống AI nội bộ: {type(e).__name__}"
            last_status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            logger.error(f"[AI_UNEXPECTED_ERROR] Lỗi không xác định ({type(e).__name__}): {e}, Model: {model_name}, Thời gian: {elapsed:.2f}s", exc_info=True)
            continue

    if context:
        context.model_used = settings.GEMINI_MODEL
        context.attempts = attempts
        context.elapsed = time.time() - total_start
        context.error_type = last_error_type
        context.error_detail = last_error_detail

    raise HTTPException(
        status_code=last_status_code,
        detail=last_error_detail
    )
