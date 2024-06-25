function isPivot(candle, window, data) {
  let start = candle - window;
  let end = candle + window;

  if (candle - window < 0 || candle + window >= data.length) {
    return 0;
  }

  let pivotHigh = 1;
  let pivotLow = 2;

  for (let i = candle - window; i <= candle + window; i++) {
    if (data[candle].Low > data[i].Low) {
      pivotLow = 0;
    }
    if (data[candle].High < data[i].High) {
      pivotHigh = 0;
    }
  }

  if (pivotHigh && pivotLow) {
    return 3;
  } else if (pivotHigh) {
    return pivotHigh;
  } else if (pivotLow) {
    return pivotLow;
  } else {
    return 0;
  }
}

function pivotPositionPoint(x) {
  if (x.isPivot === 2) {
    return x.Low - 1e-3;
  } else if (x.isPivot === 1) {
    return x.High + 1e-3;
  } else {
    return NaN;
  }
}

function highLowPrice(x) {
  if (x.isPivot === 2) {
    return x.Low;
  } else if (x.isPivot === 1) {
    return x.High;
  } else {
    return NaN;
  }
}

function swingHighPrice(x) {
  if (x.isPivot === 1) {
    return x.High;
  } else {
    return NaN;
  }
}

function swingLowPrice(x) {
  if (x.isPivot === 2) {
    return x.Low;
  } else {
    return NaN;
  }
}

function calPlotPivot(data, window) {
  let date_time = Array.from(new Set(data.map((item) => item.index.date))).map(
    (date) => date.toString(),
  );
  data = calcPivotPosition(data, window);
  data.forEach((row) => {
    row.pointpos = pivotPositionPoint(row);
  });
  data.forEach((row) => {
    row.high_low_price = highLowPrice(row);
  });
  data.forEach((row) => {
    row.swing_high_price = swingHighPrice(row);
  });
  data.forEach((row) => {
    row.swing_low_price = swingLowPrice(row);
  });
  return [date_time, data];
}

function calHL(data) {
  let btm_y = 0;
  let top_y = 0;
  let swing = [];
  let break_list = [];
  let bullish_swing_dict = { swing: null, start_date: null, end_date: null };
  let bearish_swing_dict = { swing: null, start_date: null, end_date: null };

  data.forEach((item) => {
    let dt = item.Date;
    let Open = item.Open;
    let High = item.High;
    let Low = item.Low;
    let Close = item.Close;
    let hl_price = item.high_low_price;

    let top_bool = false;
    let btm_bool = false;
    top = 0;
    btm = 0;

    // Check if hl_price is equal to High or Low
    if (hl_price === High) {
      top = hl_price;
      top_bool = true;
      btm_bool = false;
    }
    if (hl_price === Low) {
      btm = hl_price;
      btm_bool = true;
      top_bool = false;
    }

    // Pivot Low
    if (!isNaN(hl_price) && btm_bool) {
      let swing_position = btm < btm_y ? 'LL' : 'HL';
      btm_y = btm;
      swing.push(btm_y);
      bullish_swing_dict = { swing: btm_y, start_date: dt, end_date: null };
      break_list.push(bullish_swing_dict);
    }

    // Pivot High
    if (!isNaN(hl_price) && top_bool) {
      let swing_position = top > top_y ? 'HH' : 'LH';
      top_y = top;
      swing.push(top_y);
      bearish_swing_dict = { swing: top_y, start_date: dt, end_date: null };
      break_list.push(bearish_swing_dict);
    }

    swing.forEach((sw) => {
      if ((Close > sw && Open < sw) || (Close < sw && Open > sw)) {
        break_list.forEach((sw_item) => {
          let price = sw_item.swing;
          let start = sw_item.start_date;
          let end = sw_item.end_date;

          if (price === sw) {
            sw_item.end_date = dt;
            let idx = swing.indexOf(sw);
            if (idx > -1) {
              swing.splice(swing.indexOf(sw), 1);
            }
          }
        });
      }
    });
  });

  return break_list;
}

module.exports = calHL;
