import xml.etree.ElementTree as ET
import datetime
import logging

logger = logging.getLogger("tbo_integration")

def strip_namespace(tag):
    if '}' in tag:
        return tag.split('}', 1)[1]
    return tag

def parse_hotel_search_response(xml_response: str, agency_id: str) -> list[dict]:
    events = []
    try:
        root = ET.fromstring(xml_response)
        # Using iter() to bypass namespace complexities
        for el in root.iter():
            if strip_namespace(el.tag) == "HotelSearchResponse":
                res_count = 0
                checkin_date = None
                city_id = "Unknown"
                # Mock grabbing checkin and city from request parameters if absent in response
                # But typically search response gives back available hotels
                for hotel in el.iter():
                    if strip_namespace(hotel.tag) == "HotelResult":
                        res_count += 1
                
                events.append({
                    "event_type": "hotel_search",
                    "agency_id": agency_id,
                    "destination_city": "City_" + city_id, # Fallback, ideally parsed from request payload memory 
                    "city_id": city_id,
                    "checkin_date": datetime.datetime.utcnow().isoformat(), # Fallback
                    "search_date": datetime.datetime.utcnow().isoformat(),
                    "results_count": res_count,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                })
    except Exception as e:
        logger.error(f"[{datetime.datetime.utcnow().isoformat()}] [ERROR] [TBO_PARSER] parse_hotel_search_response Failed to parse XML: {e}")
    return events

def parse_booking_detail_response(xml_response: str, agency_id: str) -> dict:
    try:
        root = ET.fromstring(xml_response)
        event = {
            "event_type": "booking_confirmed",
            "agency_id": agency_id,
            "guest_names": [],
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "booking_date": datetime.datetime.utcnow().isoformat(),
            "is_refundable": False,
            "booking_value": 0.0,
            "booking_ref": "",
            "hotel_name": "Unknown Hotel",
            "destination_city": "Unknown City",
            "checkin_date": datetime.datetime.utcnow().isoformat(),
            "checkout_date": datetime.datetime.utcnow().isoformat()
        }
        
        for el in root.iter():
            tag = strip_namespace(el.tag)
            if tag == "BookingId" or tag == "ConfirmationNo":
                event["booking_ref"] = el.text
            elif tag == "HotelName":
                event["hotel_name"] = el.text
            elif tag == "CityName" or tag == "City":
                event["destination_city"] = el.text
            elif tag == "CheckInDate":
                try: 
                    event["checkin_date"] = datetime.datetime.strptime(el.text.split('T')[0], "%Y-%m-%d").isoformat()
                except: pass
            elif tag == "CheckOutDate":
                try: 
                    event["checkout_date"] = datetime.datetime.strptime(el.text.split('T')[0], "%Y-%m-%d").isoformat()
                except: pass
            elif tag == "Price" or tag == "Amount":
                try: event["booking_value"] = float(el.text)
                except: pass
            elif tag == "IsRefundable":
                event["is_refundable"] = (el.text.lower() == 'true')
            elif tag == "GuestName":
                event["guest_names"].append(el.text)
                
        return event
    except Exception as e:
        logger.error(f"[{datetime.datetime.utcnow().isoformat()}] [ERROR] [TBO_PARSER] parse_booking_detail_response Failed: {e}")
        return {}

def parse_cancellation_response(xml_response: str, agency_id: str, booking_ref: str) -> dict:
    try:
        root = ET.fromstring(xml_response)
        event = {
            "event_type": "booking_cancelled",
            "agency_id": agency_id,
            "booking_ref": booking_ref,
            "cancellation_timestamp": datetime.datetime.utcnow().isoformat(),
            "refund_amount": 0.0
        }
        
        for el in root.iter():
            tag = strip_namespace(el.tag)
            if tag == "RefundAmount":
                try: event["refund_amount"] = float(el.text)
                except: pass
                
        return event
    except Exception as e:
        logger.error(f"[{datetime.datetime.utcnow().isoformat()}] [ERROR] [TBO_PARSER] parse_cancellation_response Failed: {e}")
        return {}

def parse_flight_search_response(json_response: dict, agency_id: str) -> list[dict]:
    events = []
    try:
        response_data = json_response.get("Response", {})
        results = response_data.get("Results", [[]])[0] # The first list of results
        
        for idx, result in enumerate(results):
            # We treat each flight result as a simulated booking for demo purposes
            fare = result.get("Fare", {})
            segments = result.get("Segments", [[{}]])[0]
            first_segment = segments[0] if segments else {}
            
            origin = first_segment.get("Origin", {}).get("Airport", {}).get("CityName", "Unknown")
            destination = first_segment.get("Destination", {}).get("Airport", {}).get("CityName", "Unknown")
            dep_time_str = first_segment.get("DepTime", "")
            
            event = {
                "event_type": "flight_booking_simulated",
                "agency_id": agency_id,
                "booking_ref": f"FL-{agency_id[:4]}-{result.get('ResultIndex', 'IDX')}-{idx}",
                "guest_names": ["Simulated Flight Guest"],
                "destination_city": destination,
                "booking_value": fare.get("PublishedFare", 0.0),
                "is_refundable": result.get("IsRefundable", False),
                "checkin_date": dep_time_str if dep_time_str else datetime.datetime.utcnow().isoformat(),
                "booking_date": datetime.datetime.utcnow().isoformat(),
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            events.append(event)
    except Exception as e:
        logger.error(f"[{datetime.datetime.utcnow().isoformat()}] [ERROR] [TBO_PARSER] parse_flight_search_response Failed: {e}")
    return events
