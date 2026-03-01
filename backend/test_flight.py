from tbo_flight_client import TBOFlightClient

client = TBOFlightClient()
client.timeout = 20 # Give it plenty of time

try:
    print("Authenticating...")
    token = client.authenticate()
    print("Token:", token)
    
    print("Searching flights...")
    res = client.search_flights()
    print("Response keys:", res.keys() if isinstance(res, dict) else "Not a dict")
    
    # Check if we got the mock trace ID which means it fell back
    if isinstance(res, dict) and res.get("Response", {}).get("TraceId") == "mock-trace-1234":
        print("Fell back to mock!")
    else:
        print("Success! Live data received.")
        
except Exception as e:
    print("Error:", e)
