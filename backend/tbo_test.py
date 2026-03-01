import requests

url = "http://api.tbotechnology.in/HotelAPI_V7/HotelService.svc"
headers = {"Content-Type": "text/xml;charset=UTF-8", "SOAPAction": "http://TekTravel/HotelBookingApi/HotelSearch"}
body = """<?xml version=\"1.0\" encoding=\"utf-8\"?>
<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:hot=\"http://TekTravel/HotelBookingApi\">
   <soapenv:Header>
      <hot:Credentials>
         <hot:UserName>hackathontest</hot:UserName>
         <hot:Password>Hac@98147521</hot:Password>
      </hot:Credentials>
   </soapenv:Header>
   <soapenv:Body>
      <hot:HotelSearchRequest>
         <hot:CheckInDate>2026-03-01</hot:CheckInDate>
         <hot:CheckOutDate>2026-03-03</hot:CheckOutDate>
         <hot:CountryName>India</hot:CountryName>
         <hot:CityId>130443</hot:CityId>
         <hot:RoomGuestDetails>
            <hot:RoomGuest>
               <hot:AdultCount>1</hot:AdultCount>
               <hot:ChildCount>0</hot:ChildCount>
            </hot:RoomGuest>
         </hot:RoomGuestDetails>
         <hot:ResultCount>1</hot:ResultCount>
      </hot:HotelSearchRequest>
   </soapenv:Body>
</soapenv:Envelope>"""

response = requests.post(url, headers=headers, data=body)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
