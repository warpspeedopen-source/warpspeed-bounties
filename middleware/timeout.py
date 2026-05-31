import asyncio

class TimeoutMiddleware:
    def __init__(self, timeout=30):
        self.timeout = timeout
    
    async def __call__(self, request, call_next):
        try:
            return await asyncio.wait_for(call_next(request), timeout=self.timeout)
        except asyncio.TimeoutError:
            return {"error": "Request timed out", "status": 408}