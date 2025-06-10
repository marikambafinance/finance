import requests

def ping():
    url = "https://mariamma-finance.onrender.com"  # Replace with your actual site
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code} | Response: {response.text[:100]}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    ping()
