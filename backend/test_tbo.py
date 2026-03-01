from tbo_client import TBOClient

client = TBOClient()

checkin = "2026-06-01"
checkout = "2026-06-05"

# This triggers the _post_request inside TBOClient
try:
    print("Testing TBOClient.hotel_search()...")
    res = client.hotel_search("130443", checkin, checkout)
    print("Success! First 200 chars:")
    print(res[:200])
except Exception as e:
    print("FAILED:", e)
