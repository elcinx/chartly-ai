import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def check_gemini():
    print("--- CHECKING GEMINI INTEGRATION (PORT 8000) ---")
    
    # 0. Check OpenAPI
    print("--- CHECKING OPENAPI ---")
    try:
        resp = requests.get(f"{BASE_URL}/openapi.json")
        if resp.status_code == 200:
            data = resp.json()
            paths = list(data.get('paths', {}).keys())
            print(f"[OPENAPI] Paths: {paths}")
        else:
            print(f"[OPENAPI] Failed: {resp.status_code}")
    except Exception as e:
        print(f"[OPENAPI] Exception: {e}")
    
    # 1. Check Env
    try:
        resp = requests.get(f"{BASE_URL}/api/debug-gemini-env")
        if resp.status_code == 200:
            data = resp.json()
            print(f"[ENV] Has Key: {data['has_key']}")
            print(f"[ENV] Demo Mode: {data['demo_mode']}")
        else:
            print(f"[ENV] Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[ENV] Exception: {e}")

    # 2. Check Simple Test
    try:
        resp = requests.get(f"{BASE_URL}/api/test-gemini-simple")
        if resp.status_code == 200:
            data = resp.json()
            print(f"[TEST] OK: {data.get('ok')}")
            if data.get('ok'):
                print(f"[TEST] Response: {data.get('model_response')}")
            else:
                print(f"[TEST] Error Code: {data.get('error_code')}")
                print(f"[TEST] Error Msg: {data.get('error_message')}")
                
                # Capture Error
                with open("last_error.txt", "w", encoding="utf-8") as f:
                    f.write(data.get('error_message', 'No message'))
        else:
            print(f"[TEST] Failed: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[TEST] Exception: {e}")
        with open("last_error.txt", "w", encoding="utf-8") as f:
            f.write(str(e))

if __name__ == "__main__":
    # Wait a bit for server to be up
    time.sleep(2)
    
    print("--- CHECKING ROOT ---")
    try:
        resp = requests.get(f"{BASE_URL}/")
        print(f"[ROOT] {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"[ROOT] Exception: {e}")

    check_gemini()
