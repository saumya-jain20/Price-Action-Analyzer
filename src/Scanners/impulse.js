// async function left_check(df, ind, order) {
//     if (ind - order < 0) {
//         return false;
//     }

//     for (let i = ind - 1; i >= ind - order; i--) {
//         if (df.loc[i]['Close'] > df.loc[ind]['Close']) {
//             return false;
//         }
//     }

//     return true;
// }

// async function right_check(df, ind, order) {
//     if (ind + order >= df.length) {
//         return false;
//     }

//     for (let i = ind + 1; i <= ind + order; i++) {
//         if (df.loc[i]['Close'] >= df.loc[ind]['Close']) {
//             return false;
//         }
//     }

//     return true;
// }

// async function deviation(df, left_ind, ind, right_ind) {
//     if (df.loc[left_ind]['Close'] <= df.loc[right_ind]['Close'] ||
//         df.loc[left_ind]['Close'] >= df.loc[ind]['Close'] ||
//         df.loc[right_ind]['Close'] >= df.loc[ind]['Close']) {
//         return false;
//     }

//     const first_change = df.loc[ind]['High'] - df.loc[right_ind]['Low'];
//     const second_change = df.loc[ind]['Close'] - df.loc[left_ind]['Close'];

//     if (second_change * 100 > first_change * 35) {
//         return false;
//     }

//     return true;
// }

// async function get_impulses(df) {
//     const result = [];
//     const order = 18;

//     for (let i = df.length - 1; i >= 0; i--) {
//         for (let j = order; j >= 5; j--) {
//             let flag = false;
//             const r_check = await right_check(df, i, j);
//             if (r_check) {
//                 for (let k = 7; k >= 3; k--) {
//                     const l_check = await left_check(df, i, k);
//                     if (l_check) {
//                         const dev_check = await deviation(df, i - k, i, i + j);
//                         if (dev_check) {
//                             flag = true;
//                             const first_ind = df.loc[i]['Low'].idxmin();
//                             result.push([i - k, i, first_ind]);
//                             break;
//                         }
//                     }
//                 }
//                 if (flag) {
//                     break;
//                 }
//             }

//             if (flag) {
//                 i = i + j;
//                 break;
//             }
//         }
//     }

//     return result;
// }

// module.exports = get_impulses

// // Assuming df is a DataFrame object
// // Usage example:
// // const impulses = await get_impulses(df);
// // console.log(impulses);

// async function leftCheck(data, ind, order) {
//     if (ind - order < 0) {
//         return false;
//     }

//     for (let i = ind - 1; i > ind - order; i--) {
//         if (data[i].Close > data[ind].Close) {
//             return false;
//         }
//     }

//     return true;
// }

// async function rightCheck(data, ind, order) {
//     if (ind + order >= data.length) {
//         return false;
//     }

//     for (let i = ind + 1; i <= ind + order; i++) {
//         if (data[i].Close >= data[ind].Close) {
//             return false;
//         }
//     }

//     return true;
// }

// async function deviation(data, leftInd, ind, rightInd) {
//     if (
//         data[leftInd].Close <= data[rightInd].Close ||
//         data[leftInd].Close >= data[ind].Close ||
//         data[rightInd].Close >= data[ind].Close
//     ) {
//         return false;
//     }

//     const firstChange = data[ind].High - data[rightInd].Low;
//     const secondChange = data[ind].Close - data[leftInd].Close;

//     if (secondChange * 100 > firstChange * 35) {
//         return false;
//     }

//     return true;
// }

// async function getImpulses(data) {
//     const result = [];
//     const order = 18;

//     for (let i = data.length - 1; i >= 0; i--) {
//         for (let j = order; j > 5; j--) {
//             let flag = false;
//             const rCheck = await rightCheck(data, i, j);
//             if (rCheck) {
//                 for (let k = 7; k > 3; k--) {
//                     const lCheck = await leftCheck(data, i, k);
//                     if (lCheck) {
//                         const devCheck = await deviation(data, i - k, i, i + j);
//                         if (devCheck) {
//                             flag = true;
//                             const slice = data.slice(i, i + j + 1);
//                             // Step 1: Find the minimum value in the array
//                             let minValue = Math.min(...slice);

//                             // Step 2: Find the first index of the minimum value
//                             let firstInd = slice.indexOf(minValue) + i;
//                             // const firstInd = slice.reduce((minIndex, current, index) => current.Low < slice[minIndex].Low ? index : minIndex, 0) + i;
//                             console.log("index", i);
//                             result.push([i - k, i, firstInd]);
//                             break;
//                         }
//                     }
//                 }
//                 if (flag) {
//                     break;
//                 }
//             }
//             if (flag) {
//                 i = i + j;
//                 break;
//             }
//         }
//     }

//     return result;
// }

async function leftCheck(df, ind, order) {
  if (ind - order < 0) {
    return false;
  }

  for (let i = ind - 1; i > ind - order; i--) {
    if (df[i].Close > df[ind].Close) {
      return false;
    }
  }

  return true;
}

async function rightCheck(df, ind, order) {
  if (ind + order >= df.length) {
    return false;
  }

  for (let i = ind + 1; i <= ind + order; i++) {
    if (df[i].Close >= df[ind].Close) {
      return false;
    }
  }

  return true;
}

async function deviation(df, leftInd, ind, rightInd) {
  if (
    df[leftInd].Close <= df[rightInd].Close ||
    df[leftInd].Close >= df[ind].Close ||
    df[rightInd].Close >= df[ind].Close
  ) {
    return false;
  }

  let firstChange = df[ind].High - df[rightInd].Low;
  let secondChange = df[ind].Close - df[leftInd].Close;

  if (secondChange * 100 > firstChange * 35) {
    return false;
  }

  return true;
}

async function getImpulses(df) {
  const result = [];
  const order = 18;

  for (let i = df.length - 1; i >= 0; i--) {
    for (let j = order; j > 5; j--) {
      let flag = false;
      const rCheck = await rightCheck(df, i, j);
      if (rCheck) {
        for (let k = 7; k > 3; k--) {
          const lCheck = await leftCheck(df, i, k);
          if (lCheck) {
            const devCheck = await deviation(df, i - k, i, i + j);
            if (devCheck) {
              flag = true;
              const lowValues = df.slice(i, i + j + 1).map((row) => row.Low);
              const firstInd = lowValues.indexOf(Math.min(...lowValues));
              result.push([i - k, i, i + firstInd]);
              console.log(`index: ${i}`);
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

module.exports = getImpulses;
