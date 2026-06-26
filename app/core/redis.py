import redis.asyncio as redis
from app.core.config import REDIS_HOST, REDIS_PORT

redis_server = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=False
)
