import numpy as np
from scipy.signal import argrelextrema
import pandas as pd
from datetime import datetime

def timec(pattern_list):
        for lst in pattern_list:
            for entry in lst:
                if isinstance(entry['Date'], datetime):
                    dt_object = entry['Date']
                    timestamp = int(dt_object.timestamp() * 1000)
                    entry['Date'] = timestamp
        return pattern_list

async def find_doubles_patterns(max_min: pd.DataFrame):
    
    patterns_tops = []
    patterns_bottoms = []
    pattern_list_t=[]
    pattern_list_b=[]

    patterns_tops_dict=[]
    patterns_bottoms_dict=[]
    
    for ind in range(5, len(max_min)):
        window = max_min.iloc[ind-5:ind]
#         print(window)
        
        # if window.index[-1] - window.index[0] > 50:
        #     continue
            
        a, b, c, d, e = window.iloc[0:5,4]
        f,g,h,i,j=  window.iloc[0:5,0]
        ft,gt,ht,it,jt = f.timestamp()*1000,g.timestamp()*1000,h.timestamp()*1000,i.timestamp()*1000,j.timestamp()*1000
        mn=min(abs((c-b)),abs((c-d)))
        mx=max(abs((c-b)),abs((c-d)))
        mxt=max(abs(ft-ht),abs(jt-ht))
        mnt=min(abs(ft-ht),abs(jt-ht))
        # ratio1 = max(abs(jt-ht),abs((c-d)))/ min(abs(jt-ht),abs((c-d)))
        # ratio2 = max(abs(ft-ht),abs((c-b)))/ min(abs(ft-ht),abs((c-b)))
#         print(f)
        
        # if a<b and a<d and c<b and c<d and e<b and e<d and mxt<=2*mnt and 10*mn>=5*mx and 2*abs(b-a)>=abs(b-c) and 2*abs(d-e)>=abs(d-c):
        if a<b and a<d and c<b and c<d and e<b and e<d and 10*mn>=7*mx:
        
            new_list=[]
            patterns_tops.append((window.index[0], window.index[-1]))
            new_list.append({"Date": f, "Close":a})
            new_list.append({"Date": g, "Close":b})
            new_list.append({"Date": h, "Close":c})
            new_list.append({"Date": i, "Close":d})
            new_list.append({"Date": j, "Close":e})
            pattern_list_t.append(new_list)
            # ind += 10
            
        # elif a>b and a>d and c>b and c>d and e>b and e>d and mxt<=2*mnt and 10*mn>=5*mx and 2*abs(b-a)>=abs(b-c) and 2*abs(d-e)>=abs(d-c):
        elif a>b and a>d and c>b and c>d and e>b and e>d and 10*mn>=7*mx:
        
            new_list=[]
            patterns_bottoms.append((window.index[0], window.index[-1]))
            new_list.append({"Date": f, "Close":a})
            new_list.append({"Date": g, "Close":b})
            new_list.append({"Date": h, "Close":c})
            new_list.append({"Date": i, "Close":d})
            new_list.append({"Date": j, "Close":e})
            pattern_list_b.append(new_list)
            # ind += 10
    
    pattern_list_b= timec(pattern_list_b)
    pattern_list_t= timec(pattern_list_t)

    # print(pattern_list_b)

    return pattern_list_t, pattern_list_b


async  def find_local_maximas_minimas(ohlc, window_range, smooth=False, smoothing_period=10):

    local_max_arr = []
    local_min_arr = []

    if smooth:
        smooth_close = ohlc["Close"].rolling(window=smoothing_period).mean().dropna()
        local_max = argrelextrema(smooth_close.values, np.greater)[0]
        local_min = argrelextrema(smooth_close.values, np.less)[0]
    else:
        local_max = argrelextrema(ohlc["Close"].values, np.greater)[0]
        local_min = argrelextrema(ohlc["Close"].values, np.less)[0]

    for i in local_max:
        if (i>window_range) and (i<len(ohlc)-window_range):
            local_max_arr.append(ohlc.iloc[i-window_range:i+window_range]['Close'].idxmax())
    
    for i in local_min:
        if (i>window_range) and (i<len(ohlc)-window_range):
            local_min_arr.append(ohlc.iloc[i-window_range:i+window_range]['Close'].idxmin())


    maxima  = pd.DataFrame(ohlc.loc[local_max_arr])
    minima  = pd.DataFrame(ohlc.loc[local_min_arr])
    max_min = pd.concat([maxima, minima]).sort_index()
    max_min = max_min[~max_min.index.duplicated()]

    return max_min



async def find_extreme(data: np.array, curr_index: int, order: int, direction: str) -> bool:
    n = len(data)
    curr_value = data[curr_index]
    extreme = True

    # if curr_index < order or curr_index + order >= n:
    #     return False
    
    for i in range(1, order + 1):
        left_value = data[max(curr_index - i,0)]
        right_value = data[min(curr_index + i,n-1)]

        if direction == 'top':
            if left_value >= curr_value or curr_value <= right_value:
                extreme = False
                break
        elif direction == 'bottom':
            if left_value <= curr_value or curr_value >= right_value:
                extreme = False
                break
    
    return extreme

async def find_extremes(ohlc: pd.DataFrame, order:int):
    # Rolling window local tops and bottoms
    tops = []
    bottoms = []
    res = []
    for i in range(len(ohlc)):
        flag_top = await find_extreme(ohlc['Close'].values, i, order, direction='top')
        flag_bottom = await find_extreme(ohlc['Close'].values, i, order, direction='bottom')
        if flag_top:
            tops.append(i)
        
        if flag_bottom:
            bottoms.append(i)
    
    res.extend(list(set(tops)))
    res.extend(list(set(bottoms)))

    res.sort()

    return ohlc.loc[res]
