// Checks if there is a local top detected at curr index
function rw_top(data, curr_index, order) {
  if (curr_index < order * 2 + 1) {
    return false;
  }

  let top = true;
  let k = curr_index - order;
  let v = data[k];
  for (let i = 1; i <= order; i++) {
    if (data[k + i] > v || data[k - i] > v) {
      top = false;
      break;
    }
  }

  return top;
}

// Checks if there is a local bottom detected at curr index
function rw_bottom(data, curr_index, order) {
  if (curr_index < order * 2 + 1) {
    return false;
  }

  let bottom = true;
  let k = curr_index - order;
  let v = data[k];
  for (let i = 1; i <= order; i++) {
    if (data[k + i] < v || data[k - i] < v) {
      bottom = false;
      break;
    }
  }

  return bottom;
}

function rw_extremes(data, order) {
  // Rolling window local tops and bottoms
  let tops = [];
  let bottoms = [];
  for (let i = 0; i < data.length; i++) {
    if (rw_top(data, i, order)) {
      // top[0] = confirmation index
      // top[1] = index of top
      // top[2] = price of top
      let top = [i, i - order, data[i - order]];
      tops.push(top);
    }

    if (rw_bottom(data, i, order)) {
      // bottom[0] = confirmation index
      // bottom[1] = index of bottom
      // bottom[2] = price of bottom
      let bottom = [i, i - order, data[i - order]];
      bottoms.push(bottom);
    }
  }

  return [tops, bottoms];
}

module.exports = { rw_bottom, rw_top };
