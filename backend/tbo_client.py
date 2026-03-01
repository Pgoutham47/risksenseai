import os
import requests
import datetime
import logging
from time import sleep

# Initialize logger
logger = logging.getLogger("tbo_integration")

class TBOAPIException(Exception):
    """Exception raised for TBO API logic or response errors."""
    pass

class TBOConnectionError(Exception):
    """Exception raised when TBO API is unreachable."""
    pass

class TBOClient:
    def __init__(self, use_dummy=False):
        if use_dummy:
            # Dummy is broken/hanging, so fallback to staging
            self.url = os.getenv("TBO_STAGING_URL", "http://api.tbotechnology.in/HotelAPI_V7/HotelService.svc")
            self.username = os.getenv("TBO_USERNAME", "hackathontest")
            self.password = os.getenv("TBO_PASSWORD", "Hac@98147521")
        else:
            self.url = os.getenv("TBO_STAGING_URL", "http://api.tbotechnology.in/HotelAPI_V7/HotelService.svc")
            self.username = os.getenv("TBO_USERNAME", "hackathontest")
            self.password = os.getenv("TBO_PASSWORD", "Hac@98147521")
        
        self.timeout = 10
        self.headers = {
            "Content-Type": "application/soap+xml; charset=utf-8"
        }

    def _build_auth_xml(self, action):
        return f"""<Credentials xmlns="http://TekTravel/HotelBookingApi">
        <UserName>{self.username}</UserName>
        <Password>{self.password}</Password>
    </Credentials>
    <Action soap12:mustUnderstand="1" xmlns="http://www.w3.org/2005/08/addressing">http://TekTravel/HotelBookingApi/{action}</Action>
    <To soap12:mustUnderstand="1" xmlns="http://www.w3.org/2005/08/addressing">{self.url}</To>"""

    def _post_request(self, action, envelope):
        headers = self.headers.copy()
        
        retries = 1
        for attempt in range(retries + 1):
            start_time = datetime.datetime.now()
            try:
                response = requests.post(self.url, data=envelope, headers=headers, timeout=self.timeout)
                response_time = int((datetime.datetime.now() - start_time).total_seconds() * 1000)
                
                logger.info(f"[{datetime.datetime.utcnow().isoformat()}] [INFO] [TBO_CLIENT] {action} {response_time}ms {response.status_code}")
                
                if response.status_code in [200, 500]: # SOAP sometimes returns 500 for business errors
                    return response.text
                else:
                    raise TBOAPIException(f"API Error {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                response_time = int((datetime.datetime.now() - start_time).total_seconds() * 1000)
                logger.warning(f"[{datetime.datetime.utcnow().isoformat()}] [WARNING] [TBO_CLIENT] {action} failed {response_time}ms: {e}")
                if attempt < retries:
                    sleep(3)  # wait 3s before retry
                else:
                    raise TBOConnectionError(f"Network error after retries: {str(e)}")

    def hotel_search(self, city_id, checkin_date, checkout_date, adult_count=1, room_count=1):
        """
        SOAP Action: HotelSearch
        Returns simple response XML string.
        """
        envelope = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    {self._build_auth_xml("HotelSearch")}
  </soap12:Header>
  <soap12:Body>
    <HotelSearchRequest xmlns="http://TekTravel/HotelBookingApi">
      <CheckInDate>{checkin_date}</CheckInDate>
      <CheckOutDate>{checkout_date}</CheckOutDate>
      <CountryName>India</CountryName>
      <CityId>{city_id}</CityId>
      <ResultCount>10</ResultCount>
      <RoomGuestDetails>
        <RoomGuest>
          <AdultCount>{adult_count}</AdultCount>
          <ChildCount>0</ChildCount>
        </RoomGuest>
      </RoomGuestDetails>
    </HotelSearchRequest>
  </soap12:Body>
</soap12:Envelope>"""
        return self._post_request("HotelSearch", envelope)

    def get_booking_detail(self, booking_ref):
        envelope = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    {self._build_auth_xml("HotelBookingDetail")}
  </soap12:Header>
  <soap12:Body>
    <HotelBookingDetailRequest xmlns="http://TekTravel/HotelBookingApi">
      <ConfirmationNo>{booking_ref}</ConfirmationNo>
    </HotelBookingDetailRequest>
  </soap12:Body>
</soap12:Envelope>"""
        return self._post_request("HotelBookingDetail", envelope)

    def get_hotel_cancellation_policy(self, hotel_code, checkin_date):
        envelope = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    {self._build_auth_xml("HotelCancellationPolicy")}
  </soap12:Header>
  <soap12:Body>
    <HotelCancellationPolicyRequest xmlns="http://TekTravel/HotelBookingApi">
      <HotelCode>{hotel_code}</HotelCode>
    </HotelCancellationPolicyRequest>
  </soap12:Body>
</soap12:Envelope>"""
        return self._post_request("HotelCancellationPolicy", envelope)

    def cancel_booking(self, booking_ref):
        envelope = f"""<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    {self._build_auth_xml("HotelCancel")}
  </soap12:Header>
  <soap12:Body>
    <HotelCancelRequest xmlns="http://TekTravel/HotelBookingApi">
      <ConfirmationNo>{booking_ref}</ConfirmationNo>
      <RequestType>Auto</RequestType>
    </HotelCancelRequest>
  </soap12:Body>
</soap12:Envelope>"""
        return self._post_request("HotelCancel", envelope)
