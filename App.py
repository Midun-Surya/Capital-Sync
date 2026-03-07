import streamlit as st
import yfinance as yf
import pandas as pd
import time

st.set_page_config(page_title="HFT Terminal V4", layout="wide")

# High-speed Styling
st.markdown("""
    <style>
    .stApp { background-color: #050505; color: #e2e2e2; }
    [data-testid="stMetricValue"] { font-family: 'JetBrains Mono', monospace; color: #3b82f6; }
    </style>
    """, unsafe_allow_html=True)

st.title("⚡ HFT_TERMINAL_V4")

# Manual Data Input (Your INFY Trade)
if 'data' not in st.session_state:
    st.session_state.data = pd.DataFrame([
        {'Ticker': 'INFY.NS', 'Qty': 3, 'Buy_Price': 1305.00}
    ])

# Live Fetching Engine
def fetch_live(ticker_list):
    prices = {}
    for t in ticker_list:
        ticker_obj = yf.Ticker(t)
        prices[t] = ticker_obj.fast_info['last_price']
    return prices

# UI Update
try:
    live_map = fetch_live(st.session_state.data['Ticker'].tolist())
    df = st.session_state.data.copy()
    df['LTP'] = df['Ticker'].map(live_map)
    df['P&L'] = (df['LTP'] - df['Buy_Price']) * df['Qty']
    
    col1, col2 = st.columns([1, 3])
    with col1:
        st.metric("Total Net Worth", f"₹{(df['LTP'] * df['Qty']).sum():,.2f}")
    
    with col2:
        st.table(df.style.format({'Buy_Price': '{:.2f}', 'LTP': '{:.2f}', 'P&L': '{:.2f}'}))

except Exception as e:
    st.error("Waiting for Market Connection...")

# The 5-Second Pulse
time.sleep(5)
st.rerun()