import { DataFrame } from 'pandas-js';

async function left_check(df, ind, order) {
  if (ind - order < 0) {
    return false;
  }

  for (let i = ind - 1; i >= ind - order; i--) {
    if (df.loc[i]['Close'] < df.loc[ind]['Close']) {
      return false;
    }
  }

  return true;
}

async function right_check(df, ind, order) {
  if (ind + order >= df.length) {
    return false;
  }

  for (let i = ind + 1; i <= ind + order; i++) {
    if (df.loc[i]['Close'] <= df.loc[ind]['Close']) {
      return false;
    }
  }

  return true;
}

async function deviation(df, left_ind, ind, right_ind) {
  if (
    df.loc[left_ind]['Close'] >= df.loc[right_ind]['Close'] ||
    df.loc[left_ind]['Close'] <= df.loc[ind]['Close'] ||
    df.loc[right_ind]['Close'] <= df.loc[ind]['Close']
  ) {
    return false;
  }

  const first_change = df.loc[right_ind]['High'] - df.loc[ind]['Low'];
  const second_change = df.loc[left_ind]['Close'] - df.loc[ind]['Close'];

  if (second_change * 100 > first_change * 35) {
    return false;
  }

  return true;
}

async function get_inverse_impulses(df) {
  const result = [];
  const order = 18;

  for (let i = df.length - 1; i >= 0; i--) {
    for (let j = order; j >= 5; j--) {
      let flag = false;
      const r_check = await right_check(df, i, j);
      if (r_check) {
        for (let k = 7; k >= 3; k--) {
          const l_check = await left_check(df, i, k);
          if (l_check) {
            const dev_check = await deviation(df, i - k, i, i + j);
            if (dev_check) {
              flag = true;
              const first_ind = df.loc[i]['High'].idxmax();
              result.push([i - k, i, first_ind]);
              break;
            }
          }
        }
        if (flag) {
          break;
        }
      }

      if (flag) {
        i = i + j;
        break;
      }
    }
  }

  return result;
}

// Assuming df is a DataFrame object
// Usage example:
// const inverse_impulses = await get_inverse_impulses(df);
// console.log(inverse_impulses);
