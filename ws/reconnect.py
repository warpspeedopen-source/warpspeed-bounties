import asyncio

async def connect_with_backoff(url, max_retries=5):
    delay = 1
    for i in range(max_retries):
        try:
            return await connect(url)
        except:
            await asyncio.sleep(delay)
            delay *= 2
    raise ConnectionError("Max retries exceeded")