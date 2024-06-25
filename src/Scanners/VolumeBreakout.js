// Function to resample data by day
function resampleByDay(data) {
  const resampledData = {};

  data.forEach((row) => {
    const date = row.Date.split('T')[0]; // Extracting date without time

    // Initialize day if not already present
    if (!resampledData[date]) {
      resampledData[date] = {
        Date: date,
        Volume: 0,
        Open: null,
        Close: null,
      };
    }

    // Sum volume for the day
    resampledData[date].Volume += row.Volume;

    // Update open if not set yet
    if (resampledData[date].Open === null) {
      resampledData[date].Open = row.Open;
    }

    // Update close, it will get updated for each row
    resampledData[date].Close = row.Close;
  });

  // Convert object to array
  console.log('Resampled Data is : -> ');
  console.log(Object.values(resampledData));
  return Object.values(resampledData);
}

//   // Function to aggregate data
//   function aggregate(data) {
//     const aggregatedData = {
//       Volume: data.reduce((acc, cur) => acc + cur.Volume, 0),
//       Close: data[data.length - 1].Close,
//       Open: data[0].Open,
//     };
//     return aggregatedData;
//   }

function rollingMean(data, windowSize) {
  const rollingMeans = [];
  let windowSum = 0;

  // Initialize rolling window
  const window = [];

  data.forEach((row, index) => {
    // Add volume to rolling window
    window.push(row.Volume);
    windowSum += row.Volume;

    // Remove oldest value from window if it exceeds window size
    if (window.length > windowSize) {
      const removedValue = window.shift();
      windowSum -= removedValue;
    }

    // Calculate mean for current window
    const mean = windowSum / window.length;
    rollingMeans.push({ Date: row.Date, RollingMeanVolume: mean });
  });

  return rollingMeans;
}

async function VolBreakout(data, window) {
  // Resample the data to daily timeframe and calculate rolling mean volume for the past 3 days
  const aggregatedData = resampleByDay(data);

  // Aggregate resampled data
  // const aggregatedData = aggregate(resampledData);
  const windowSize = window;
  const rollingMeanVolume = rollingMean(aggregatedData, windowSize);
  console.log('Aggregated Data is : ');
  console.log(aggregatedData);
  console.log('Rolling window data');
  console.log(rollingMeanVolume);

  // Determine bullish volume breakout
  const bullish_breakout_indices = [];
  aggregatedData.forEach((row, index) => {
    console.log(row.Volume, rollingMeanVolume[index].RollingMeanVolume);
    if (row.Volume > rollingMeanVolume[index].RollingMeanVolume) {
      bullish_breakout_indices.push(row.Date);
    }
  });

  // // Determine bearish volume breakout (for demonstration, assuming opposite condition)
  const bearish_breakout_indices = [];
  aggregatedData.forEach((row, index) => {
    console.log(row.Volume, rollingMeanVolume[index].RollingMeanVolume);
    if (row.Volume < rollingMeanVolume[index].RollingMeanVolume) {
      bearish_breakout_indices.push(row.Date);
    }
  });

  return [bullish_breakout_indices, bearish_breakout_indices];
}

module.exports = { VolBreakout };
