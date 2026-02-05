import requests
import json

# URL for Kerala Panchayat data (using the GitHub source as it's likely more stable/accessible without tokens)
# This is a common repo for Kerala data.
URL = "https://raw.githubusercontent.com/datameet/plan-data/master/kerala_plan_data/kerala_panchayats.json" 
# Or alternative reliable source if that fails. 
# Trying a known reliable GeoJSON source for Kerala LSG boundaries which usually contains names.
# Let's try to verify if we can get a list.
# A more direct list might be better. 

# Let's try to find a simple JSON list first. 
# If not, I can fallback to a hardcoded list of major ones or scrape a table.
# But the user asked to "fetch from internet".

print("Fetching data from internet...")
# Correct URL for Open Data Kerala LSG GeoJSON
# Often repositories use 'main' instead of 'master' now.
# Also the file path might be different. 
# Let's try to list the directory or use a known good one.
# Found this specific one for Kerala LSG boundaries:
URLS = [
    "https://raw.githubusercontent.com/datameet/plan-data/master/kerala_plan_data/kerala_panchayats.json",
    "https://raw.githubusercontent.com/opendatakerala/lsg-kerala-data/master/GeoJSON/lsgi.geojson",
    "https://raw.githubusercontent.com/opendatakerala/lsg-kerala-data/main/GeoJSON/lsgi.geojson",
    "https://raw.githubusercontent.com/opendatakerala/lsg-kerala-data/master/lsgi.geojson",
    "https://raw.githubusercontent.com/opendatakerala/lsg-kerala-data/main/lsgi.geojson"
]

for url in URLS:
    print(f"Trying {url}...")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print(f"Success! Fetched from {url}")
            try:
                data = response.json()
                print(type(data))
                # It might be a dict or list. Let's spy.
                if isinstance(data, list):
                    print(f"List of {len(data)} items")
                    print(data[0])
                elif isinstance(data, dict):
                    print("Dict keys:", data.keys())
                    # If it's a dict, maybe the list is inside a key
                    first_key = list(data.keys())[0]
                    print(f"First key: {first_key}, Value type: {type(data[first_key])}")
                    print(data[first_key])
                break
            except Exception as e:
                print(f"JSON Parse Error: {e}")
        else:
            print(f"Failed: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
