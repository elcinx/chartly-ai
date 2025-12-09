import pandas as pd
from main import suggest_charts, SESSIONS, get_dtype_str, Suggestion, SuggestionsResponse
import asyncio
import uuid

# Mock dataframe creation
def create_mock_session():
    data = {
        'sepal_length': [5.1, 4.9, 4.7, 4.6, 5.0],  # Numeric
        'sepal_width': [3.5, 3.0, 3.2, 3.1, 3.6],   # Numeric
        'species': ['setosa', 'setosa', 'setosa', 'setosa', 'setosa'], # Categorical
        'date': pd.to_datetime(['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05']) # Datetime
    }
    df = pd.DataFrame(data)
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = df
    return session_id

async def run_tests():
    session_id = create_mock_session()
    print(f"Test Session ID: {session_id}")
    
    scenarios = [
        {"name": "Auto Detect (No Cols)", "payload": {}},
        {"name": "Numeric vs Numeric", "payload": {"x": "sepal_length", "y": "sepal_width"}},
        {"name": "Categorical vs Numeric", "payload": {"x": "species", "y": "sepal_length"}},
        {"name": "Datetime vs Numeric", "payload": {"x": "date", "y": "sepal_length"}},
        {"name": "Single Numeric", "payload": {"x": "sepal_length"}},
        {"name": "Single Categorical", "payload": {"x": "species"}}
    ]
    
    for s in scenarios:
        print(f"\n--- Scenario: {s['name']} ---")
        req = {"session_id": session_id, **s['payload']}
        try:
            # Depending on how suggest_charts is implemented (sync or async wrapper needed?)
            # main.py defined it as async def suggest_charts(request: dict)
            # We can call it directly since we are in async loop
            response = await suggest_charts(req)
            for i, sug in enumerate(response.suggestions):
                print(f"{i+1}. {sug.chart_type} ({'Recommended' if sug.recommended else 'Alt'}): {sug.reason}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())
