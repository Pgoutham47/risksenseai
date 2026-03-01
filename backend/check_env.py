import os
from tbo_client import TBOClient

client = TBOClient(use_dummy=False)
print("URL in TBOClient:", client.url)
print("ENV TBO_STAGING_URL:", os.getenv("TBO_STAGING_URL"))

checkin = "2026-06-01"
checkout = "2026-06-05"
try:
    print("Testing Hotel Search:")
    res = client.hotel_search("130443", checkin, checkout)
    print("Length:", len(res))
    print("Data:", res[:100])
except Exception as e:
    print("Error:", e)
