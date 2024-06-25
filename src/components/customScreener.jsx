import React, { useState, useEffect } from 'react';
import '../App.css';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CSGraph from './csGraph';
import axios from 'axios';
import { useMsal } from '@azure/msal-react';
import { add } from 'date-fns';

let BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CustomScreeners = () => {
  // const [customScreenersData, setCustomScreenersData] = useState([]); // selected Custom screeners data from the backend
  const [productOptions, setProductOptions] = useState([]); // stores all the products available
  const [selectedProduct, setSelectedProduct] = useState(null); // stores selected product

  const [contractOptions, setContractOptions] = useState([]); // stores all the contracts of the selected Product
  const [selectedContract, setSelectedContract] = useState(null); // stores selected contract

  const [interval, setInterval] = useState(null); // stores the time interval

  const [startDate, setStartDate] = useState(null); // stores the startdate while fetching the ohlc data
  const [endDate, setEndDate] = useState(null); // stores the enddate while fetching the ohlc data

  // for the azure authentication with only hertshtengroup
  const { instance } = useMsal(); // creating instance
  const { accounts } = useMsal(); // to store the current user logged in details

  const [type, setType] = useState(false);

  const [rows, setRows] = useState([{ id: 1 }]);
  const [allRowsData, setAllRowsData] = useState([
    {
      id: 1,
      indicatorBlock1: 'sma',
      source1: 'Open',
      period1: '20',
      lag1: '0',
      indicatorBlock2: 'sma',
      source2: 'Open',
      period2: '20',
      lag2: '0',
      operator: '>',
      notGate: 'false',
    },
  ]);

  const [gate, setGate] = useState('and'); // and | or condition

  const [data, setData] = useState([]); // stores the ohlc data for the selected contract
  const [showChart, setShowChart] = useState(false); // to show the data on the amcharts

  const [historicalData, setHistoricalData] = useState(null);

  const [finalResult, setFinalResult] = useState([]);

  const [indicatorValues, setIndicatorValues] = useState([]);

  const [loading, setLoading] = useState(false);

  // to send to the backend while saving the custom screener
  const [screenerName, setScreenerName] = useState('');
  const [screenerExplanation, setScreenerExplanation] = useState('');

  const [customScreenerOptions, setCustomScreenerOptions] = useState([]);

  const [selectedCustomScreener, setSelectedCustomScreener] = useState(null);

  const [currentCustomScreenerData, setCurrentCustomScreenerData] = useState(
    [],
  ); // current selected custom screener data from the backend

  const [currentCustomScreenerId, setCurrentCustomScreenerId] = useState(null);

  const [finalLag, setFinalLag] = useState(0);

  // to fetch all the products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/watchlist/products`, {
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        });
        const formattedProducts = response.data.map((product) => ({
          label: product,
          value: product,
        }));
        setProductOptions(() => formattedProducts); // functional update
        console.log('These are the available products: ', response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // to fetch all the contracts of the selected product
  useEffect(() => {
    const fetchContracts = async () => {
      if (!selectedProduct) return;
      try {
        const response = await axios.get(
          `${BASE_URL}/watchlist/contracts/${selectedProduct}`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
            },
          },
        );
        let data = response.data;
        let dataToPass = [];
        data.map((d) => {
          dataToPass.push({ label: d, value: d });
        });
        setContractOptions(dataToPass);
        console.log(
          'These are the available contracts of the ',
          selectedProduct,
          ': ',
          response.data,
        );
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    };

    if (selectedProduct) {
      fetchContracts();
    }
  }, [selectedProduct]);

  // to select the custom_screener of the user from the dropdown
  useEffect(() => {
    if (instance.getActiveAccount()) {
      const fetchScreeners = async () => {
        try {
          let url = `${BASE_URL}/screenerlist/get_screeners`;
          const userData = accounts[0];
          let user_Id = userData.homeAccountId.split('.')[0];
          // console.log(user_Id);
          if (user_Id) {
            // means user is logged in
            url += `?user_id=${user_Id}`;
          }
          const response = await fetch(url, {
            headers: {
              'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch screeners from the backend');
          }
          const data = await response.json();

          // console.log(data);

          let temp_arr = [];
          for (let i = 0; i < data.length; i++) {
            if (data[i].custom === true) {
              temp_arr.push({
                label: data[i].symbol,
                value: data[i].symbol,
              });
            }
          }
          // console.log(temp_arr);
          setCustomScreenerOptions(temp_arr);
        } catch (error) {
          console.error('Error:', error.message);
        }
      };

      fetchScreeners();
    }
  }, []);

  const change_format = (data) => {
    let new_data = [];

    for (let i = 0; i < data.length; i++) {
      const obj = {
        Date: data[i][0] * 1000,
        Open: data[i][1],
        High: data[i][2],
        Low: data[i][3],
        Close: data[i][4],
        Volume: data[i][5],
      };
      new_data.push(obj);
    }
    return new_data;
  };

  const fetchUpdatedBlocks = async () => {
    const userData = accounts[0];
    let user_Id = userData.homeAccountId.split('.')[0];
    try {
      const response = await axios.get(
        `${BASE_URL}/screenerlist/get_custom_screener_by_name?user_id=${user_Id}&custom_screener_name=${selectedCustomScreener}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        },
      );
      if (response.status === 200) {
        const custom_data = response.data;
        console.log('Updated Blocks Data:', custom_data);

        // Update the state with the fetched data
        if (custom_data) {
          setCurrentCustomScreenerId(custom_data.id);
          setScreenerName(custom_data.name);
          setScreenerExplanation(custom_data.explanation);
          setGate(custom_data.gate);
          if (custom_data.blocks) {
            setCurrentCustomScreenerData(custom_data.blocks);
          }
        }
      } else {
        alert('Failed to fetch updated blocks');
      }
    } catch (error) {
      console.error('Error fetching updated blocks:', error);
      alert('An error occurred while fetching updated blocks');
    }
  };

  const addRow = () => {
    const newRow = {
      id: rows.length + 1,
      indicatorBlock1: 'sma',
      source1: 'Open',
      period1: '20',
      lag1: '0',
      indicatorBlock2: 'sma',
      source2: 'Open',
      period2: '20',
      lag2: '0',
      operator: '>',
      notGate: 'false',
    };

    setRows((prevRows) => [...prevRows, newRow]);
    let userData = null;
    let user_Id = null;
    if (instance.getActiveAccount()) {
      userData = accounts[0];
      user_Id = userData.homeAccountId.split('.')[0];
    }

    if (selectedCustomScreener === null) {
      setAllRowsData((prevData) => [...prevData, newRow]);
    } else {
      axios
        .post(
          `${BASE_URL}/screenerlist/add_custom_screener_block?user_id=${user_Id}&custom_screener_name=${screenerName}`,
          [newRow],
          {
            headers: {
              'ngrok-skip-browser-warning': 'true',
            },
          },
        )
        .then(async (response) => {
          if (response.status === 200) {
            console.log('New block added successfully to the backend');
            await fetchUpdatedBlocks();
          } else {
            alert('Failed to add new block to the backend');
          }
        })
        .catch((error) => {
          console.error('Error adding new block to the backend:', error);
          alert('An error occurred while adding the new block');
        });
    }
  };

  const handleSelectionChange = (rowId, fieldName, value) => {
    if (selectedCustomScreener !== null) {
      setCurrentCustomScreenerData((prevData) => {
        const newData = [...prevData];
        const rowIndex = newData.findIndex((row) => row.id === rowId);
        if (rowIndex !== -1) {
          newData[rowIndex] = {
            ...newData[rowIndex],
            [fieldName]: value,
          };
        }
        return newData;
      });
    } else {
      setAllRowsData((prevData) => {
        const newData = [...prevData];
        const rowIndex = newData.findIndex((row) => row.id === rowId);
        if (rowIndex !== -1) {
          newData[rowIndex] = {
            ...newData[rowIndex],
            [fieldName]: value,
          };
        }
        return newData;
      });
    }
  };

  const handleProductChange = (selectedOption) => {
    setSelectedProduct(selectedOption.value);
  };

  const handleContractChange = (selectedOption) => {
    setSelectedContract(selectedOption.value);
  };

  const handleIntervalChange = (selectedOption) => {
    setInterval(selectedOption.value);
  };

  const handleCustomScreenerChange = (selectedOption) => {
    setSelectedCustomScreener(selectedOption.value);

    let selectedScreener = selectedOption.value;

    const fetchDataforCurrentCustomScreener = async () => {
      const userData = accounts[0];
      let user_Id = userData.homeAccountId.split('.')[0];
      const custom_apiURL = `${BASE_URL}/screenerlist/get_custom_screener_by_name?user_id=${user_Id}&custom_screener_name=${selectedScreener}`;
      try {
        const response = await fetch(custom_apiURL, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch data from the backend');
        }

        let custom_data = await response.json();
        console.log('Data for', selectedScreener, ': ', custom_data);

        if (custom_data !== null) {
          setCurrentCustomScreenerId(custom_data.id);
          setScreenerName(custom_data.name);
          setScreenerExplanation(custom_data.explanation);
          setGate(custom_data.gate);
          for (let i in custom_data) {
            if (i === 'blocks') {
              let temp_arr = [];
              for (let j of custom_data[i]) {
                temp_arr.push(j);
              }
              setCurrentCustomScreenerData(temp_arr);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    if (selectedScreener !== null) {
      fetchDataforCurrentCustomScreener();
    }
  };

  const handleDeleteRow = async (rowId) => {
    if (selectedCustomScreener === null) {
      // Remove the row from the local state
      setAllRowsData((prevData) => prevData.filter((row) => row.id !== rowId));
      setRows((prevRows) => prevRows.filter((row) => row.id !== rowId));
    } else {
      if (currentCustomScreenerData.length === 1) {
        alert('Screener should contain at least one condition');
        return;
      }
      // when custom Screener is selected

      const deleteApiUrl = `${BASE_URL}/screenerlist/delete_custom_screener_block/${rowId}`;

      try {
        const response = await axios.delete(deleteApiUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        });

        if (response.status === 200) {
          console.log('Screener block deleted successfully');
          // Remove the deleted row from the state
          setCurrentCustomScreenerData((prevData) =>
            prevData.filter((row) => row.id !== rowId),
          );
        } else {
          alert('Failed to delete screener block');
        }
      } catch (error) {
        console.error('Error deleting screener block:', error);
        alert('An error occurred while deleting the screener block');
      }
    }
  };

  const intervalOptions = [
    { label: '15 min', value: '15min' },
    { label: '30 min', value: '30min' },
    { label: '45 min', value: '45min' },
    { label: '1 hr', value: '1hr' },
    { label: '2 hr', value: '2hr' },
    { label: '4 hr', value: '4hr' },
    { label: '1 day', value: '1day' },
  ];

  // fetching using our backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        let apiUrl = `${BASE_URL}/historicalData/${selectedProduct}/${selectedContract}?time_frame=${interval}`;

        if (startDate) {
          apiUrl += `&start_date=${startDate}`;
        }
        if (endDate) {
          apiUrl += `&end_date=${endDate}`;
        }
        const response = await fetch(apiUrl, {
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        console.log(data);

        // const dynamicKey = `${selectedContract}_${interval}`;
        // const formattedData = change_format(data[dynamicKey].DATA);

        setData(data.reverse());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (selectedContract && interval) {
      fetchData();
    }
  }, [selectedContract, interval, startDate, endDate]);

  function createCopyDatabaseFull(obj) {
    return {
      data: obj.data.map((item) => ({ ...item })),
    };
  }

  function sma(obj, source, period, lag) {
    const fieldName = 'sma(' + source + ')' + period;
    let sum = 0;
    for (let i = Math.max(0, lag); i < Math.max(0, lag) + period; i++) {
      sum += obj.data[i][source];
    }
    obj.data[Math.max(0, lag) + period - 1][fieldName] = sum / period;
    for (let i = Math.max(0, lag) + period; i < obj.data.length; i++) {
      sum += obj.data[i][source];
      sum -= obj.data[i - period][source];
      obj.data[i][fieldName] = sum / period;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function ema(obj, source, period, lag) {
    const fieldName = 'ema(' + source + ')' + period;
    let sum = 0;
    const multiplier = 2 / (period + 1);
    for (let i = Math.max(0, lag); i < Math.max(0, lag) + period; i++) {
      sum += obj.data[i][source];
    }
    let emaValue = sum / period;
    obj.data[Math.max(0, lag) + period - 1][fieldName] = emaValue;
    for (let i = Math.max(0, lag) + period; i < obj.data.length; i++) {
      emaValue = (obj.data[i][source] - emaValue) * multiplier + emaValue;
      obj.data[i][fieldName] = emaValue;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function bbl(obj, source, period, sdperiod, lag) {
    const sma_list = sma(obj, source, period, lag);
    const fieldName = 'bbl(' + source + ')' + period + '-' + sdperiod;
    for (let i = period - 1 + Math.max(0, lag); i < obj.data.length; i++) {
      const mean = sma_list[i];
      let sum = 0;
      for (let j = i; j > i - period; j--) {
        const temp = Math.pow(obj.data[j][source] - mean, 2);
        sum += temp;
      }
      const sd = Math.sqrt(sum / period);
      obj.data[i][fieldName] = mean - sdperiod * sd;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function bbu(obj, source, period, sdperiod, lag) {
    const sma_list = sma(obj, source, period, lag);
    const fieldName = 'bbu(' + source + ')' + period + '-' + sdperiod;
    for (let i = period - 1 + Math.max(0, lag); i < obj.data.length; i++) {
      const mean = sma_list[i];
      let sum = 0;
      for (let j = i; j > i - period; j--) {
        const temp = Math.pow(obj.data[j][source] - mean, 2);
        sum += temp;
      }
      const sd = Math.sqrt(sum / period);
      obj.data[i][fieldName] = mean + sdperiod * sd;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function rsi(obj, source, period, lag) {
    const fieldname = 'rsi(' + source + ')' + period;
    let avgain = 0;
    let avloss = 0;
    for (let i = 1; i < obj.data.length; i++) {
      let change = obj.data[i][source] - obj.data[i - 1][source];
      let gain = change > 0 ? change : 0;
      let loss = change < 0 ? -change : 0;
      if (i <= period) {
        avgain = (avgain * (i - 1) + gain) / i;
        avloss = (avloss * (i - 1) + loss) / i;
      } else {
        avgain = (avgain * (period - 1) + gain) / period;
        avloss = (avloss * (period - 1) + loss) / period;
      }
      let rsi = 100;
      if (avloss != 0) {
        rsi = 100 - 100 / (1 + avgain / avloss);
      }
      obj.data[i][fieldname] = rsi;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function atr(obj, period, lag) {
    const fieldName = 'atr' + period;
    let TR = [];
    for (let i = 0; i < 1 + Math.max(0, lag); i++) TR.push(null);
    for (let i = 1 + Math.max(0, lag); i < obj.data.length; i++) {
      let high = obj.data[i]['High'];
      let low = obj.data[i]['Low'];
      let close_prev = obj.data[i - 1]['Close'];
      let mx = high - low;
      mx = Math.max(mx, Math.abs(high - close_prev));
      mx = Math.max(mx, Math.abs(low - close_prev));
      TR.push(mx);
    }
    let res = 0;
    for (let i = Math.max(0, lag); i < period + Math.max(0, lag); i++) {
      res += TR[i];
      res = res / period;
    }
    obj.data[period + Math.max(0, lag) - 1][fieldName] = res;
    for (let i = period + Math.max(0, lag); i < TR.length; i++) {
      res = (res * (period - 1) + TR[i]) / period;
      obj.data[i][fieldName] = res;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function atru(obj, period, multiplier, lag) {
    const fieldName = 'atr' + period;
    const atrUpperField = 'atru' + period;
    atr(obj, period, lag);
    for (let i = 0; i < obj.data.length; i++) {
      if (obj.data[i][fieldName] !== undefined) {
        obj.data[i][atrUpperField] =
          obj.data[i]['Close'] + multiplier * obj.data[i][fieldName];
      } else {
        obj.data[i][atrUpperField] = null;
      }
    }
    return obj.data.map((item) => item[atrUpperField]);
  }

  function atrl(obj, period, multiplier, lag) {
    const fieldName = 'atr' + period;
    const atrLowerField = 'atrl' + period;
    atr(obj, period, lag);
    for (let i = 0; i < obj.data.length; i++) {
      if (obj.data[i][fieldName] !== undefined) {
        obj.data[i][atrLowerField] =
          obj.data[i]['Close'] - multiplier * obj.data[i][fieldName];
      } else {
        obj.data[i][atrLowerField] = null;
      }
    }
    return obj.data.map((item) => item[atrLowerField]);
  }

  function rma(obj, source, period, lag) {
    const fieldName = 'rma(' + source + ')' + period;
    let sum = 0;
    for (let i = Math.max(0, lag); i < Math.max(0, lag) + period; i++) {
      sum += obj.data[i][source];
    }
    let rmaValue = sum / period;
    obj.data[Math.max(0, lag) + period - 1][fieldName] = rmaValue;
    for (let i = Math.max(0, lag) + period; i < obj.data.length; i++) {
      rmaValue = (rmaValue * (period - 1) + obj.data[i][source]) / period;
      obj.data[i][fieldName] = rmaValue;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function wma(obj, source, period, lag) {
    const fieldName = 'wma(' + source + ')' + period;
    const den = (period * (period + 1)) / 2;
    let sum = 0;
    for (let i = Math.max(0, lag); i < Math.max(0, lag) + period - 1; i++) {
      sum += obj.data[i][source];
      obj.data[i][fieldName] = sum / (i - Math.max(0, lag) + 1);
    }
    for (let i = Math.max(0, lag) + period - 1; i < obj.data.length; i++) {
      let num = 0;
      for (let j = i, k = period; j > i - period; j--, k--) {
        num += obj.data[j][source] * k;
      }
      obj.data[i][fieldName] = num / den;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function tma(obj, source, period, lag) {
    const fieldName = 'tma(' + source + ')' + period;
    const tempSource = 'sma(' + source + ')' + period;
    const databaseClone = createCopyDatabaseFull(obj);
    sma(databaseClone, source, period, lag);
    for (
      let i = Math.max(0, lag) + period - 1;
      i < databaseClone.data.length;
      i++
    ) {
      databaseClone.data[i][source] = databaseClone.data[i][tempSource];
    }
    sma(databaseClone, source, period, lag);
    for (
      let i = Math.max(0, lag) + period - 1;
      i < databaseClone.data.length;
      i++
    ) {
      obj.data[i][fieldName] = databaseClone.data[i][tempSource];
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function vwap(obj, source, period, lag) {
    const fieldName = 'vwap(' + source + ')' + period;
    for (let i = period - 1; i < obj.data.length; i++) {
      let num = 0;
      let den = 0;
      for (let j = i; j > i - period; j--) {
        num += obj.data[j][source] * obj.data[j].Volume;
        den += obj.data[j].Volume;
      }
      obj.data[i][fieldName] = num / den;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function vwapl(obj, source, period, sdperiod, lag) {
    const vwapFieldName = 'vwap(' + source + ')' + period;
    const fieldName = 'vwapl(' + source + ')' + period + '-' + sdperiod;
    vwap(obj, source, period, lag);
    for (let i = period - 1; i < obj.data.length; i++) {
      const vwapValue = obj.data[i][vwapFieldName];
      let sum = 0;
      let den = 0;
      for (let j = i; j > i - period; j--) {
        const temp =
          Math.pow(obj.data[j][source] - vwapValue, 2) * obj.data[j].Volume;
        sum += temp;
        den += obj.data[j].Volume;
      }
      const sd = Math.sqrt(sum / den);
      obj.data[i][fieldName] = vwapValue - sdperiod * sd;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function vwapu(obj, source, period, sdperiod, lag) {
    const vwapFieldName = 'vwap(' + source + ')' + period;
    const fieldName = 'vwapu(' + source + ')' + period + '-' + sdperiod;
    vwap(obj, source, period, lag);
    for (let i = period - 1; i < obj.data.length; i++) {
      const vwapValue = obj.data[i][vwapFieldName];
      let sum = 0;
      let den = 0;
      for (let j = i; j > i - period; j--) {
        const temp =
          Math.pow(obj.data[j][source] - vwapValue, 2) * obj.data[j].Volume;
        sum += temp;
        den += obj.data[j].Volume;
      }
      const sd = Math.sqrt(sum / den);
      obj.data[i][fieldName] = vwapValue + sdperiod * sd;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function supertrend(obj, atrperiod, multiplier, lag) {
    const databaseclone = createCopyDatabaseFull(obj);
    const fieldname1 = 'supertrend' + atrperiod + '-' + multiplier;
    const fieldname2 = 'atr' + atrperiod;
    const fupfn = 'f_up';
    const fdnfn = 'f_down';
    atr(databaseclone, atrperiod, lag);
    for (let i = Math.max(0, lag); i < databaseclone.data.length; i++) {
      if (i < atrperiod + Math.max(0, lag) - 1) {
        obj.data[i][fieldname1] = undefined;
        continue;
      }
      const basic_up =
        (obj.data[i].High + obj.data[i].Low) / 2 +
        multiplier * databaseclone.data[i][fieldname2];
      const basic_down =
        (obj.data[i].High + obj.data[i].Low) / 2 -
        multiplier * databaseclone.data[i][fieldname2];
      databaseclone.data[i]['bup'] = basic_up;
      databaseclone.data[i]['bdn'] = basic_down;
      if (i === atrperiod + Math.max(0, lag) - 1) {
        databaseclone.data[i][fupfn] = basic_up;
        databaseclone.data[i][fdnfn] = basic_down;
        obj.data[i][fieldname1] = basic_up;
      } else {
        if (
          basic_up < databaseclone.data[i - 1][fupfn] ||
          databaseclone.data[i - 1].Close > databaseclone.data[i - 1][fupfn]
        ) {
          databaseclone.data[i][fupfn] = basic_up;
        } else {
          databaseclone.data[i][fupfn] = databaseclone.data[i - 1][fupfn];
        }
        if (
          basic_down > databaseclone.data[i - 1][fdnfn] ||
          databaseclone.data[i - 1].Close < databaseclone.data[i - 1][fdnfn]
        ) {
          databaseclone.data[i][fdnfn] = basic_down;
        } else {
          databaseclone.data[i][fdnfn] = databaseclone.data[i - 1][fdnfn];
        }
        if (
          obj.data[i - 1][fieldname1] === databaseclone.data[i - 1][fupfn] &&
          databaseclone.data[i].Close <= databaseclone.data[i][fupfn]
        ) {
          obj.data[i][fieldname1] = databaseclone.data[i][fupfn];
        } else if (
          obj.data[i - 1][fieldname1] === databaseclone.data[i - 1][fupfn] &&
          databaseclone.data[i].Close >= databaseclone.data[i][fupfn]
        ) {
          obj.data[i][fieldname1] = databaseclone.data[i][fdnfn];
        } else if (
          obj.data[i - 1][fieldname1] === databaseclone.data[i - 1][fdnfn] &&
          databaseclone.data[i].Close >= databaseclone.data[i][fdnfn]
        ) {
          obj.data[i][fieldname1] = databaseclone.data[i][fdnfn];
        } else if (
          obj.data[i - 1][fieldname1] === databaseclone.data[i - 1][fdnfn] &&
          databaseclone.data[i].Close <= databaseclone.data[i][fdnfn]
        ) {
          obj.data[i][fieldname1] = databaseclone.data[i][fupfn];
        }
      }
    }
    return obj.data.map((item) => item[fieldname1]);
  }

  function macd(obj, source, fastema, slowema, signalline, lag) {
    var databaseclone = createCopyDatabaseFull(obj);
    var fastemafield = 'ema(' + source + ')' + fastema;
    var slowemafield = 'ema(' + source + ')' + slowema;
    var fieldname =
      'macd(' + source + ')' + fastema + '-' + slowema + '-' + signalline;
    var signallinefield = 'ema(c)' + signalline;
    for (var i = 0; i < databaseclone.data.length; i++) {
      databaseclone.data[i][source] = obj.data[i][source];
    }
    ema(databaseclone, source, fastema, lag);
    ema(databaseclone, source, slowema, lag);
    for (var i = Math.max(0, lag); i < databaseclone.data.length; i++) {
      if (
        databaseclone.data[i][fastemafield] !== undefined &&
        databaseclone.data[i][slowemafield] !== undefined
      ) {
        var macd =
          databaseclone.data[i][fastemafield] -
          databaseclone.data[i][slowemafield];
        databaseclone.data[i]['c'] = macd;
      } else {
        databaseclone.data[i]['c'] = undefined;
      }
    }
    let sum = 0;
    const multiplier = 2 / (signalline + 1);
    for (let i = Math.max(0, lag); i < Math.max(0, lag) + signalline; i++) {
      if (databaseclone.data[i]['c'] !== undefined) {
        sum += databaseclone.data[i]['c'];
      }
    }
    if (Math.max(0, lag) + signalline - 1 < databaseclone.data.length) {
      let emaValue = sum / signalline;
      databaseclone.data[Math.max(0, lag) + signalline - 1][signallinefield] =
        emaValue;
      for (
        let i = Math.max(0, lag) + signalline;
        i < databaseclone.data.length;
        i++
      ) {
        if (databaseclone.data[i]['c'] !== undefined) {
          emaValue =
            (databaseclone.data[i]['c'] - emaValue) * multiplier + emaValue;
          databaseclone.data[i][signallinefield] = emaValue;
        }
      }
    }
    for (var i = Math.max(0, lag); i < databaseclone.data.length; i++) {
      if (
        databaseclone.data[i]['c'] !== undefined &&
        databaseclone.data[i][signallinefield] !== undefined
      ) {
        var macdhist =
          databaseclone.data[i]['c'] - databaseclone.data[i][signallinefield];
        obj.data[i][fieldname] = macdhist;
      } else {
        obj.data[i][fieldname] = undefined;
      }
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function psar(obj, minaf, maxaf, lag) {
    const fieldName = 'psar' + minaf + '-' + maxaf;
    const start = 1;
    let isBelow = false;
    let maxMin = 0;
    let result = 0;
    let isFirstTrendBar = true;
    let acceleration = minaf;
    if (obj.data[start].Close > obj.data[start - 1].Close) {
      isBelow = true;
      maxMin = obj.data[start].High;
      result = obj.data[start - 1].Low;
    } else {
      isBelow = false;
      maxMin = obj.data[start].Low;
      result = obj.data[start - 1].High;
    }
    obj.data[start][fieldName] = result;
    for (let i = start + 1; i < obj.data.length; i++) {
      result = result + acceleration * (maxMin - result);
      if (i > start + 1) isFirstTrendBar = false;
      let low = obj.data[i].Low;
      let high = obj.data[i].High;
      if (isBelow) {
        if (result > low) {
          isFirstTrendBar = true;
          isBelow = false;
          result = Math.max(high, maxMin);
          maxMin = low;
          acceleration = minaf;
        }
      } else {
        if (result < high) {
          isFirstTrendBar = true;
          isBelow = true;
          result = Math.min(low, maxMin);
          maxMin = high;
          acceleration = minaf;
        }
      }
      if (!isFirstTrendBar) {
        if (isBelow) {
          if (high > maxMin) {
            maxMin = high;
            acceleration = Math.min(acceleration + minaf, maxaf);
          }
        } else {
          if (low < maxMin) {
            maxMin = low;
            acceleration = Math.min(acceleration + minaf, maxaf);
          }
        }
      }
      if (isBelow) result = Math.min(result, obj.data[i - 2].Low);
      else result = Math.max(result, obj.data[i - 2].High);

      obj.data[i][fieldName] = result;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function stochk(obj, kperiod, lag) {
    const fieldName = 'stochk(' + kperiod + ')';
    for (let i = Math.max(0, lag) + kperiod - 1; i < obj.data.length; i++) {
      let mini = Number.MAX_VALUE;
      let maxi = Number.MIN_VALUE;
      for (let j = i; j > i - kperiod; j--) {
        if (obj.data[j].High > maxi) {
          maxi = obj.data[j].High;
        }
        if (obj.data[j].Low < mini) {
          mini = obj.data[j].Low;
        }
      }
      const task_k = ((obj.data[i].Close - mini) / (maxi - mini)) * 100;
      obj.data[i][fieldName] = task_k;
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function smad(obj, source, period, lag) {
    const fieldName = 'sma(' + source + ')' + period;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < period; i++) {
      if (obj.data[i][source] !== undefined) {
        sum += obj.data[i][source];
        count++;
      }
    }
    if (count > 0) {
      obj.data[period - 1][fieldName] = sum / count;
    }

    for (let i = period; i < obj.data.length; i++) {
      if (
        obj.data[i][source] !== undefined &&
        obj.data[i - period][source] !== undefined
      ) {
        sum += obj.data[i][source];
        sum -= obj.data[i - period][source];
        obj.data[i][fieldName] = sum / period;
      } else {
        obj.data[i][fieldName] = undefined;
      }
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function stochd(obj, kperiod, dperiod, lag) {
    const stochkFieldName = 'stochk(' + kperiod + ')';
    const fieldName = 'stochd(' + kperiod + '-' + dperiod + ')';
    const databaseClone = createCopyDatabaseFull(obj);
    stochk(databaseClone, kperiod, lag);
    const smaValues = smad(databaseClone, stochkFieldName, dperiod, lag);
    for (let i = Math.max(0, lag) + kperiod - 1; i < obj.data.length; i++) {
      obj.data[i][fieldName] = smaValues[i];
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function cci(obj, source, period, lag) {
    var fieldname = 'cci(' + source + ')' + period;
    var smafieldname = 'sma(' + source + ')' + period;
    sma(obj, source, period, lag);
    for (var i = period - 1 + Math.max(0, lag); i < obj.data.length; i++) {
      var mean = obj.data[i][smafieldname];
      var sum = 0;
      for (var j = i; j > i - period; j--) {
        if (obj.data[j] && obj.data[j][source] !== undefined) {
          var temp = Math.abs(obj.data[j][source] - mean);
          sum += temp;
        }
      }
      var sd = sum / period;
      obj.data[i][fieldname] = (obj.data[i][source] - mean) / (0.015 * sd);
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function choppiness(obj, period, lag) {
    const fieldName = 'ci' + period;
    const smaField = 'sma(atr1)' + period;
    const hField = 'hh' + period;
    const lField = 'll' + period;
    const databaseClone = createCopyDatabaseFull(obj);
    atr(databaseClone, 1, 0);
    smad(databaseClone, 'atr1', period, 0);
    for (let i = period - 1; i < obj.data.length; i++) {
      let maxHigh = Number.MIN_VALUE;
      let minLow = Number.MAX_VALUE;
      for (let j = i; j > i - period; j--) {
        if (maxHigh < obj.data[j].High) {
          maxHigh = obj.data[j].High;
        }
        if (minLow > obj.data[j].Low) {
          minLow = obj.data[j].Low;
        }
      }
      databaseClone.data[i][hField] = maxHigh;
      databaseClone.data[i][lField] = minLow;
    }
    for (let i = period - 1; i < obj.data.length; i++) {
      const smaAtr = databaseClone.data[i][smaField];
      const hh = databaseClone.data[i][hField];
      const ll = databaseClone.data[i][lField];

      if (smaAtr !== undefined && hh !== undefined && ll !== undefined) {
        obj.data[i][fieldName] =
          (100 * Math.log10((smaAtr * period) / (hh - ll))) /
          Math.log10(period);
      } else {
        obj.data[i][fieldName] = undefined;
      }
    }
    return obj.data.map((item) => item[fieldName]);
  }

  function lowerl(obj, period, lag) {
    const fieldname = 'lower_l' + period;
    for (let i = period - 1; i < obj.data.length; i++) {
      let mini = Number.MAX_VALUE;
      for (let j = i; j > i - period; j--) {
        if (mini > obj.data[j].Low) {
          mini = obj.data[j].Low;
        }
      }
      obj.data[i][fieldname] = mini;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function higherh(obj, period, lag) {
    const fieldname = 'higher_h' + period;
    for (let i = period - 1; i < obj.data.length; i++) {
      let maxi = Number.MIN_VALUE;
      for (let j = i; j > i - period; j--) {
        if (maxi < obj.data[j].High) {
          maxi = obj.data[j].High;
        }
      }
      obj.data[i][fieldname] = maxi;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function change(obj, lag) {
    const fieldname = 'change';
    for (let i = 1; i < obj.data.length; i++) {
      obj.data[i][fieldname] = obj.data[i].Close - obj.data[i - 1].Close;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function hl2(obj, lag) {
    const fieldname = 'hl2';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] = (obj.data[i].High + obj.data[i].Low) / 2;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function hlc3(obj, lag) {
    const fieldname = 'hlc3';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] =
        (obj.data[i].High + obj.data[i].Low + obj.data[i].Close) / 3;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function ohlc4(obj, lag) {
    const fieldname = 'ohlc4';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] =
        (obj.data[i].Open +
          obj.data[i].High +
          obj.data[i].Low +
          obj.data[i].Close) /
        4;
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function range(obj, lag) {
    const highsource = 'High';
    const lowsource = 'Low';
    const fieldname = 'range';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] = obj.data[i][highsource] - obj.data[i][lowsource];
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function bodyAbs(obj, lag) {
    const fieldname = 'bodyabs';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] = Math.abs(obj.data[i].Close - obj.data[i].Open);
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function lowerWick(obj, lag) {
    const fieldname = 'lower_wick';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] = Math.abs(
        Math.min(obj.data[i].Open, obj.data[i].Close) - obj.data[i].Low,
      );
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function upperWick(obj, lag) {
    const fieldname = 'upper_wick';
    for (let i = 0; i < obj.data.length; i++) {
      obj.data[i][fieldname] =
        obj.data[i].High - Math.max(obj.data[i].Open, obj.data[i].Close);
    }
    return obj.data.map((item) => item[fieldname]);
  }

  function compareValues(value1, value2, comparator) {
    if (value1.length !== value2.length) {
      throw new Error('Array lengths do not match');
    }
    const result = [];
    for (let i = 0; i < value1.length; i++) {
      if (value1[i] === undefined || value2[i] === undefined) {
        result.push(undefined);
      } else {
        switch (comparator) {
          case '==':
            result.push(value1[i] === value2[i]);
            break;
          case '<':
            result.push(value1[i] < value2[i]);
            break;
          case '>':
            result.push(value1[i] > value2[i]);
            break;
          case '<=':
            result.push(value1[i] <= value2[i]);
            break;
          case '>=':
            result.push(value1[i] >= value2[i]);
            break;
          case '!=':
            result.push(value1[i] !== value2[i]);
            break;
          case 'crossesover':
            result.push(
              value1[i] > value2[i] && value1[i - 1] <= value2[i - 1],
            );
            break;
          case 'crossesunder':
            result.push(
              value1[i] < value2[i] && value1[i - 1] >= value2[i - 1],
            );
            break;
          default:
            throw new Error('Invalid comparator');
        }
      }
    }
    return result;
  }

  function negateArray(array) {
    return array.map((element) => {
      if (element === undefined) {
        return undefined;
      } else {
        return !element; // negate the element
      }
    });
  }

  const calculateIndicatorValue = (
    obj,
    indicatorBlock,
    source,
    period,
    lag,
  ) => {
    switch (indicatorBlock) {
      case 'sma':
        return sma(obj, source, period, lag);
      case 'ema':
        return ema(obj, source, period, lag);
      case 'bbl':
        return bbl(obj, source, period, 2, lag);
      case 'bbu':
        return bbu(obj, source, period, 2, lag);
      case 'rsi':
        return rsi(obj, source, period, lag);
      case 'atr':
        return atr(obj, period, lag);
      case 'atrl':
        return atrl(obj, period, 2, lag);
      case 'atru':
        return atru(obj, period, 2, lag);
      case 'rma':
        return rma(obj, source, period, lag);
      case 'wma':
        return wma(obj, source, period, lag);
      case 'tma':
        return tma(obj, source, period, lag);
      case 'vwap':
        return vwap(obj, source, period, lag);
      case 'vwapl':
        return vwapl(obj, source, period, 2, lag);
      case 'vwapu':
        return vwapu(obj, source, period, 2, lag);
      case 'supertrend':
        return supertrend(obj, period, 2, lag);
      case 'macd':
        return macd(obj, source, 12, 26, period, lag);
      case 'psar':
        return psar(obj, 0.02, 0.2, lag);
      case 'stochk':
        return stochk(obj, period, lag);
      case 'stochd':
        return stochd(obj, period, 2, lag);
      case 'cci':
        return cci(obj, source, period, lag);
      case 'choppiness':
        return choppiness(obj, period, lag);
      case 'lowerl':
        return lowerl(obj, period, lag);
      case 'higherh':
        return higherh(obj, period, lag);
      case 'change':
        return change(obj, lag);
      case 'hl2':
        return hl2(obj, lag);
      case 'hlc3':
        return hlc3(obj, lag);
      case 'ohlc4':
        return ohlc4(obj, lag);
      case 'range':
        return range(obj, lag);
      case 'bodyAbs':
        return bodyAbs(obj, lag);
      case 'lowerWick':
        return lowerWick(obj, lag);
      case 'upperWick':
        return upperWick(obj, lag);
      default:
        throw new Error('Invalid indicator block');
    }
  };

  const handleSave = async () => {
    // only allowed to save a custom screener when you are logged in
    if (instance.getActiveAccount()) {
      if (screenerName && screenerExplanation) {
        const userData = accounts[0];
        if (userData) {
          let user_Id = userData.homeAccountId.split('.')[0]; // Extracting the unqiue ID of the logged in user

          if (allRowsData.length === 0) {
            alert('Screener should contain at least one condition');
            return;
          }

          try {
            const custom_screener_response = await axios.post(
              `${BASE_URL}/screenerlist/create_custom_screener`,
              {
                user_id: user_Id,
                custom_screener_name: screenerName,
                explanation: screenerExplanation,
                gate: gate,
              },
            );

            if (custom_screener_response.status === 200) {
              alert('Custom screener saved successfully');

              // Add new custom screener to options
              const newScreener = {
                label: screenerName,
                value: screenerName,
              };
              setCustomScreenerOptions((prevOptions) => [
                ...prevOptions,
                newScreener,
              ]);
            } else {
              alert('Failed to save custom screener');
            }

            console.log('Data I am sending', allRowsData);
            for (let rowData in allRowsData) {
              allRowsData[rowData].lag1 = allRowsData[rowData].lag1.toString();
              allRowsData[rowData].lag2 = allRowsData[rowData].lag2.toString();
            }
            const update_block = await axios.post(
              `${BASE_URL}/screenerlist/add_custom_screener_block?user_id=${user_Id}&custom_screener_name=${screenerName}`,
              allRowsData,
            );

            if (update_block.status === 200) {
              console.log('Custom screener block saved successfully');
            } else {
              alert('Failed to save custom screener block');
            }
          } catch (error) {
            console.error('Error saving custom screener:', error);
            alert('An error occurred while saving the custom screener');
          }
        }
      } else {
        alert(
          'Please enter screener name and explanation to save your custom screener.',
        );
      }
    } else {
      alert('Please login first to save your custom screener.');
    }
  };

  const handleCheck = async () => {
    if (
      selectedProduct === null ||
      selectedContract === null ||
      interval === null
    ) {
      alert('Please select a contract and interval to check.');
      return;
    }

    const obj = {
      // ohlc data for the selected contract
      data: data,
    };

    if (obj.data.length <= 40) {
      alert('Data is not present.');
      return;
    }

    // console.log("allRowsData", allRowsData); // these are the conditions which are to be applied
    let finalResult = [];

    var finalLag = 0;
    var type = false;

    let indicatorValues = [];

    // Determine which data to use for the check
    const rowsDataToUse = selectedCustomScreener
      ? currentCustomScreenerData
      : allRowsData;

    console.log('rowsDataToUse', rowsDataToUse);

    rowsDataToUse.forEach((rowData, index) => {
      let indicatorValue1 = [];
      let indicatorValue2 = [];
      // rowdata are the fields, and index is index
      const value1 = calculateIndicatorValue(
        obj,
        rowData.indicatorBlock1,
        rowData.source1,
        parseInt(rowData.period1),
        rowData.lag1,
      );
      const value2 = calculateIndicatorValue(
        obj,
        rowData.indicatorBlock2,
        rowData.source2,
        parseInt(rowData.period2),
        rowData.lag2,
      );

      data.forEach((candle, index) => {
        let valueArray1 = value1[index];
        let valueArray2 = value2[index];
        if (valueArray1 != undefined) {
          indicatorValue1.push({
            Date: candle.Date,
            Value: valueArray1,
          });
        }
        if (valueArray2 != undefined) {
          indicatorValue2.push({
            Date: candle.Date,
            Value: valueArray2,
          });
        }
      });

      indicatorValues.push({
        name: rowData.indicatorBlock1,
        value: indicatorValue1,
      });
      indicatorValues.push({
        name: rowData.indicatorBlock2,
        value: indicatorValue2,
      });

      rowData.lag1 = Number(rowData.lag1);
      rowData.lag2 = Number(rowData.lag2);
      var totalLag = Math.max(rowData.lag1, rowData.lag2);
      finalLag = Math.max(totalLag, finalLag);

      if (
        rowData.operator == '==' ||
        rowData.operator == 'crossesover' ||
        rowData.operator == 'crossesunder'
      ) {
        type = true;
      }

      console.log('Value 1:', value1);
      console.log('Value 2:', value2);

      let result = compareValues(value1, value2, rowData.operator);
      console.log('Result:', result);

      if (rowData.notGate === 'true') {
        result = negateArray(result);
      }
      console.log(`Row ${index + 1} Result:`, result);

      if (index === 0) {
        finalResult = result;
      } else {
        finalResult = finalResult.map((val, idx) => {
          if (val === undefined || result[idx] === undefined) {
            return undefined;
          } else if (gate === 'and') {
            return val && result[idx];
          } else if (gate === 'or') {
            return val || result[idx];
          }
        });
      }
    });

    setIndicatorValues(indicatorValues);
    console.log('Indicator Values:', indicatorValues);
    setFinalResult(finalResult);
    console.log('Final Result:', finalResult);
    setFinalLag(finalLag);
    console.log('Final Lag', finalLag);
    setType(type);

    try {
      let apiUrl = `${BASE_URL}/historicalData/${selectedProduct}/${selectedContract}?time_frame=${interval}`;

      if (startDate) {
        apiUrl += `&start_date=${startDate}`;
      }
      if (endDate) {
        apiUrl += `&end_date=${endDate}`;
      }
      const response = await fetch(apiUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      console.log(data);

      setHistoricalData(data.reverse());
      setShowChart(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentCustomScreenerId) {
      alert('Please select a custom screener to delete.');
      return;
    }

    const deleteApiUrl = `${BASE_URL}/screenerlist/delete_custom_screener/${currentCustomScreenerId}`;

    console.log(deleteApiUrl);

    try {
      const response = await axios.delete(deleteApiUrl, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
        },
      });

      console.log('Response status:', response.status); // Log the status

      if (response.status === 200) {
        console.log('Custom screener deleted successfully');
        // Remove the deleted screener from the state
        // setShowChart(false)
        setCustomScreenerOptions((prevOptions) =>
          prevOptions.filter(
            (screener) => screener.value !== selectedCustomScreener,
          ),
        );
        // setCustomScreenersData((prevData) =>
        //   prevData.filter(
        //     (screener) => screener.value !== selectedCustomScreener
        //   )
        // );

        setSelectedCustomScreener(null);
        setCurrentCustomScreenerId(null);
        setCurrentCustomScreenerData([]);
        setScreenerName('');
        setScreenerExplanation('');
      } else {
        alert('Failed to delete custom screener');
      }
    } catch (error) {
      console.error('Error deleting custom screener:', error);
      alert('An error occurred while deleting the custom screener');
    }
  };

  const handleUpdate = async () => {
    if (!currentCustomScreenerId) {
      alert('Please select a custom screener to update.');
      return;
    }

    const dataToUpdate = {
      id: currentCustomScreenerId,
      name: screenerName,
      explanation: screenerExplanation,
      gate: gate,
      blocks: currentCustomScreenerData,
    };

    const updateApiUrl = `${BASE_URL}/screenerlist/update_custom_screener/`;
    console.log('data i am sending', dataToUpdate);

    try {
      const response = await axios.patch(updateApiUrl, dataToUpdate, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
        },
      });

      if (response.status === 200) {
        alert('Custom screener updated successfully');
        console.log('Custom screener updated successfully', response.data);
      } else {
        alert('Failed to update custom screener');
      }
    } catch (error) {
      console.error('Error updating custom screener:', error);
      // alert("An error occurred while updating the custom screener");
    }
  };

  const dynamicColumns = rows.map((row) => (
    <div key={row.id} className="col-md-6" style={{ paddingBottom: '10px' }}>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '14px' }}
      >
        <select
          id={`not_gate${row.id}Id1`}
          onChange={(e) =>
            handleSelectionChange(row.id, 'notGate', e.target.value)
          }
        >
          <option value="false"></option>
          <option value="true">NOT</option>
        </select>
      </div>
      <select
        id={`ind${row.id}Id1`}
        style={{ display: 'inline-block' }}
        onChange={(e) =>
          handleSelectionChange(row.id, 'indicatorBlock1', e.target.value)
        }
      >
        <option value="sma">SMA</option>
        <option value="ema">EMA</option>
        <option value="bbl">BB-LOWER</option>
        <option value="bbu">BB-UPPER</option>
        <option value="rsi">RSI</option>
        <option value="atr">ATR</option>
        <option value="atrl">ATR-LOWER</option>
        <option value="atru">ATR-UPPER</option>
        <option value="rma">RMA</option>
        <option value="wma">WMA</option>
        <option value="tma">TMA</option>
        <option value="vwap">VWAP</option>
        <option value="vwapl">VWAP-LOWER</option>
        <option value="vwapu">VWAP-UPPER</option>
        <option value="supertrend">SUPERTREND</option>
        <option value="macd">MACD</option>
        <option value="psar">PARABOLIC_SAR</option>
        <option value="stochk">STOCH_K</option>
        <option value="stochd">STOCH_D</option>
        <option value="cci">CCI</option>
        {/* <option value="choppiness">CHOPPINESS</option> */}
        <option value="lowerl">LOWER_L</option>
        <option value="higherh">HIGHER_H</option>
        <option value="change">CHANGE</option>
        <option value="hl2">HL2</option>
        <option value="hlc3">HLC3</option>
        <option value="ohlc4">OHLC4</option>
        <option value="range">RANGE</option>
        <option value="bodyAbs">BODY_ABS</option>
        <option value="lowerWick">LOWER_WICK</option>
        <option value="upperWick">UPPER_WICK</option>
      </select>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Source :
        </label>
        <select
          id={`ind${row.id}srcId1`}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'source1', e.target.value)
          }
        >
          <option value="Open">OPEN</option>
          <option value="High">HIGH</option>
          <option value="Low">LOW</option>
          <option value="Close">CLOSE</option>
        </select>
      </div>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Period :
        </label>
        <input
          id={`ind${row.id}p1Id1`}
          defaultValue={20}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'period1', e.target.value)
          }
        />
      </div>
      <span
        id={`ind${row.id}Index1`}
        style={{ display: 'inline-block', marginLeft: '5px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Lag :
        </label>
        <select
          id={`ind${row.id}IndexId1`}
          className="candleindex"
          onChange={(e) =>
            handleSelectionChange(row.id, 'lag1', e.target.value)
          }
        >
          <option value="0">T-0</option>
          <option value="1">T-1</option>
          <option value="2">T-2</option>
          <option value="3">T-3</option>
          <option value="4">T-4</option>
          <option value="5">T-5</option>
          <option value="6">T-6</option>
          <option value="7">T-7</option>
          <option value="8">T-8</option>
          <option value="9">T-9</option>
          <option value="10">T-10</option>
        </select>
      </span>
      <select
        id={`comp${row.id}Id1`}
        style={{
          display: 'inline-block',
          // width: "110px",
          marginLeft: '10px',
          marginRight: '10px',
        }}
        onChange={(e) =>
          handleSelectionChange(row.id, 'operator', e.target.value)
        }
      >
        <option value="&gt;">&gt;</option>
        <option value="&gt;=">&gt;=</option>
        <option value="&lt;">&lt;</option>
        <option value="&lt;=">&lt;=</option>
        <option value="==">==</option>
        <option value="!=">!=</option>
        <option value="crossesover">Crosses Over</option>
        <option value="crossesunder">Crosses Under</option>
      </select>
      <select
        id={`ind${row.id}Id2`}
        style={{ display: 'inline-block', marginLeft: '10px' }}
        onChange={(e) =>
          handleSelectionChange(row.id, 'indicatorBlock2', e.target.value)
        }
      >
        <option value="sma">SMA</option>
        <option value="ema">EMA</option>
        <option value="bbl">BB-LOWER</option>
        <option value="bbu">BB-UPPER</option>
        <option value="rsi">RSI</option>
        <option value="atr">ATR</option>
        <option value="atrl">ATR-LOWER</option>
        <option value="atru">ATR-UPPER</option>
        <option value="rma">RMA</option>
        <option value="wma">WMA</option>
        <option value="tma">TMA</option>
        <option value="vwap">VWAP</option>
        <option value="vwapl">VWAP-LOWER</option>
        <option value="vwapu">VWAP-UPPER</option>
        <option value="supertrend">SUPERTREND</option>
        <option value="macd">MACD</option>
        <option value="psar">PARABOLIC_SAR</option>
        <option value="stochk">STOCH_K</option>
        <option value="stochd">STOCH_D</option>
        <option value="cci">CCI</option>
        {/* <option value="choppiness">CHOPPINESS</option> */}
        <option value="lowerl">LOWER_L</option>
        <option value="higherh">HIGHER_H</option>
        <option value="change">CHANGE</option>
        <option value="hl2">HL2</option>
        <option value="hlc3">HLC3</option>
        <option value="ohlc4">OHLC4</option>
        <option value="range">RANGE</option>
        <option value="bodyAbs">BODY_ABS</option>
        <option value="lowerWick">LOWER_WICK</option>
        <option value="upperWick">UPPER_WICK</option>
      </select>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Source :
        </label>
        <select
          id={`ind${row.id}srcId2`}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'source2', e.target.value)
          }
        >
          <option value="Open">OPEN</option>
          <option value="High">HIGH</option>
          <option value="Low">LOW</option>
          <option value="Close">CLOSE</option>
        </select>
      </div>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Period :
        </label>
        <input
          id={`ind${row.id}p1Id2`}
          defaultValue={20}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'period2', e.target.value)
          }
        />
      </div>
      <span
        id={`ind${row.id}Index2`}
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Lag :
        </label>
        <select
          id={`ind${row.id}IndexId2`}
          className="candleindex"
          onChange={(e) =>
            handleSelectionChange(row.id, 'lag2', e.target.value)
          }
        >
          <option value="0">T-0</option>
          <option value="1">T-1</option>
          <option value="2">T-2</option>
          <option value="3">T-3</option>
          <option value="4">T-4</option>
          <option value="5">T-5</option>
          <option value="6">T-6</option>
          <option value="7">T-7</option>
          <option value="8">T-8</option>
          <option value="9">T-9</option>
          <option value="10">T-10</option>
        </select>
      </span>

      <button
        style={{
          marginLeft: '20px',
          display: 'inline-block',
          paddingLeft: '13px',
          paddingRight: '13px',
        }}
        onClick={() => handleDeleteRow(row.id)}
      >
        -
      </button>
    </div>
  ));

  const dynamicColumns2 = currentCustomScreenerData.map((row, index) => (
    <div key={row.id} className="col-md-6" style={{ paddingBottom: '10px' }}>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '14px' }}
      >
        <select
          id={`not_gate${row.id}Id1`}
          onChange={(e) =>
            handleSelectionChange(row.id, 'notGate', e.target.value)
          }
          value={row.notGate} // Populate the value
        >
          <option value="false"></option>
          <option value="true">NOT</option>
        </select>
      </div>
      <select
        id={`ind${row.id}Id1`}
        style={{ display: 'inline-block' }}
        onChange={(e) =>
          handleSelectionChange(row.id, 'indicatorBlock1', e.target.value)
        }
        value={row.indicatorBlock1} // Populate the value
      >
        <option value="sma">SMA</option>
        <option value="ema">EMA</option>
        <option value="bbl">BB-LOWER</option>
        <option value="bbu">BB-UPPER</option>
        <option value="rsi">RSI</option>
        <option value="atr">ATR</option>
        <option value="atrl">ATR-LOWER</option>
        <option value="atru">ATR-UPPER</option>
        <option value="rma">RMA</option>
        <option value="wma">WMA</option>
        <option value="tma">TMA</option>
        <option value="vwap">VWAP</option>
        <option value="vwapl">VWAP-LOWER</option>
        <option value="vwapu">VWAP-UPPER</option>
        <option value="supertrend">SUPERTREND</option>
        <option value="macd">MACD</option>
        <option value="psar">PARABOLIC_SAR</option>
        <option value="stochk">STOCH_K</option>
        <option value="stochd">STOCH_D</option>
        <option value="cci">CCI</option>
        {/* <option value="choppiness">CHOPPINESS</option> */}
        <option value="lowerl">LOWER_L</option>
        <option value="higherh">HIGHER_H</option>
        <option value="change">CHANGE</option>
        <option value="hl2">HL2</option>
        <option value="hlc3">HLC3</option>
        <option value="ohlc4">OHLC4</option>
        <option value="range">RANGE</option>
        <option value="bodyAbs">BODY_ABS</option>
        <option value="lowerWick">LOWER_WICK</option>
        <option value="upperWick">UPPER_WICK</option>
      </select>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Source :
        </label>
        <select
          id={`ind${row.id}srcId1`}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'source1', e.target.value)
          }
          value={row.source1} // Populate the value
        >
          <option value="Open">OPEN</option>
          <option value="High">HIGH</option>
          <option value="Low">LOW</option>
          <option value="Close">CLOSE</option>
        </select>
      </div>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Period :
        </label>
        <input
          id={`ind${row.id}p1Id1`}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'period1', e.target.value)
          }
          value={row.period1} // Populate the value
        />
      </div>
      <span
        id={`ind${row.id}Index1`}
        style={{ display: 'inline-block', marginLeft: '5px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Lag :
        </label>
        <select
          id={`ind${row.id}IndexId1`}
          className="candleindex"
          onChange={(e) =>
            handleSelectionChange(row.id, 'lag1', e.target.value)
          }
          value={row.lag1} // Populate the value
        >
          <option value="0">T-0</option>
          <option value="1">T-1</option>
          <option value="2">T-2</option>
          <option value="3">T-3</option>
          <option value="4">T-4</option>
          <option value="5">T-5</option>
          <option value="6">T-6</option>
          <option value="7">T-7</option>
          <option value="8">T-8</option>
          <option value="9">T-9</option>
          <option value="10">T-10</option>
        </select>
      </span>
      <select
        id={`comp${row.id}Id1`}
        style={{
          display: 'inline-block',
          marginLeft: '10px',
          marginRight: '10px',
        }}
        onChange={(e) =>
          handleSelectionChange(row.id, 'operator', e.target.value)
        }
        value={row.operator} // Populate the value
      >
        <option value="&gt;">&gt;</option>
        <option value="&gt;=">&gt;=</option>
        <option value="&lt;">&lt;</option>
        <option value="&lt;=">&lt;=</option>
        <option value="==">==</option>
        <option value="!=">!=</option>
        <option value="crossesover">Crosses Over</option>
        <option value="crossesunder">Crosses Under</option>
      </select>
      <select
        id={`ind${row.id}Id2`}
        style={{ display: 'inline-block', marginLeft: '10px' }}
        onChange={(e) =>
          handleSelectionChange(row.id, 'indicatorBlock2', e.target.value)
        }
        value={row.indicatorBlock2} // Populate the value
      >
        <option value="sma">SMA</option>
        <option value="ema">EMA</option>
        <option value="bbl">BB-LOWER</option>
        <option value="bbu">BB-UPPER</option>
        <option value="rsi">RSI</option>
        <option value="atr">ATR</option>
        <option value="atrl">ATR-LOWER</option>
        <option value="atru">ATR-UPPER</option>
        <option value="rma">RMA</option>
        <option value="wma">WMA</option>
        <option value="tma">TMA</option>
        <option value="vwap">VWAP</option>
        <option value="vwapl">VWAP-LOWER</option>
        <option value="vwapu">VWAP-UPPER</option>
        <option value="supertrend">SUPERTREND</option>
        <option value="macd">MACD</option>
        <option value="psar">PARABOLIC_SAR</option>
        <option value="stochk">STOCH_K</option>
        <option value="stochd">STOCH_D</option>
        <option value="cci">CCI</option>
        {/* <option value="choppiness">CHOPPINESS</option> */}
        <option value="lowerl">LOWER_L</option>
        <option value="higherh">HIGHER_H</option>
        <option value="change">CHANGE</option>
        <option value="hl2">HL2</option>
        <option value="hlc3">HLC3</option>
        <option value="ohlc4">OHLC4</option>
        <option value="range">RANGE</option>
        <option value="bodyAbs">BODY_ABS</option>
        <option value="lowerWick">LOWER_WICK</option>
        <option value="upperWick">UPPER_WICK</option>
      </select>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Source :
        </label>
        <select
          id={`ind${row.id}srcId2`}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'source2', e.target.value)
          }
          value={row.source2} // Populate the value
        >
          <option value="Open">OPEN</option>
          <option value="High">HIGH</option>
          <option value="Low">LOW</option>
          <option value="Close">CLOSE</option>
        </select>
      </div>
      <div
        className="floating"
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Period :
        </label>
        <input
          id={`ind${row.id}p1Id2`}
          className="inputparam"
          onChange={(e) =>
            handleSelectionChange(row.id, 'period2', e.target.value)
          }
          value={row.period2} // Populate the value
        />
      </div>
      <span
        id={`ind${row.id}Index2`}
        style={{ display: 'inline-block', marginLeft: '10px' }}
      >
        <label htmlFor="label" style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Lag :
        </label>
        <select
          id={`ind${row.id}IndexId2`}
          className="candleindex"
          onChange={(e) =>
            handleSelectionChange(row.id, 'lag2', e.target.value)
          }
          value={row.lag2} // Populate the value
        >
          <option value="0">T-0</option>
          <option value="1">T-1</option>
          <option value="2">T-2</option>
          <option value="3">T-3</option>
          <option value="4">T-4</option>
          <option value="5">T-5</option>
          <option value="6">T-6</option>
          <option value="7">T-7</option>
          <option value="8">T-8</option>
          <option value="9">T-9</option>
          <option value="10">T-10</option>
        </select>
      </span>

      <button
        style={{
          marginLeft: '20px',
          display: 'inline-block',
          paddingLeft: '13px',
          paddingRight: '13px',
        }}
        onClick={() => handleDeleteRow(row.id)}
      >
        -
      </button>
    </div>
  ));

  return (
    <div className="custom-screeners-container">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <p className="custom-screeners-heading">Custom Screener</p>
          <div className="row">
            <div className="col-md-10">
              <div className="well">
                <div className="contract-specs-header">
                  <strong>Contract Specifications</strong>
                </div>
                <div className="row">
                  <div className="col-md-12 ">
                    <div className="input-box">
                      <span>Products</span>
                      <Select
                        // styles={custo}
                        styles={customStylesContracts}
                        options={productOptions}
                        onChange={handleProductChange}
                        placeholder="Select a Product"
                      />
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div className="input-box">
                      <span>Contracts</span>
                      <Select
                        styles={customStylesContracts}
                        options={contractOptions}
                        onChange={handleContractChange}
                        placeholder="Select a Contract"
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-box">
                      <span>Time Interval</span>
                      <Select
                        styles={customStylesContracts}
                        placeholder="Select an Interval"
                        options={intervalOptions}
                        onChange={handleIntervalChange}
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-box">
                      <span>Start Date</span>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(Date.parse(date))}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select Start Date"
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-box">
                      <span>End Date</span>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(Date.parse(date))}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="Select End Date"
                      />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-box">
                      <span>Screener Name</span>
                      <div style={{ marginRight: '10px' }}>
                        <input
                          type="text"
                          // value={selectedCustomScreener ? screenerName : ""}
                          value={screenerName}
                          onChange={(e) => setScreenerName(e.target.value)}
                          placeholder={
                            selectedCustomScreener ? '' : 'Enter Screener Name'
                          }
                          styles={customStylesContracts}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-box">
                      <span>Screener Explanation</span>
                      <div style={{ marginRight: '10px' }}>
                        <input
                          type="text"
                          // value={selectedCustomScreener ? screenerExplanation : ""}
                          value={screenerExplanation}
                          onChange={(e) =>
                            setScreenerExplanation(e.target.value)
                          }
                          placeholder="Enter Screener Explanation"
                          className="form-control"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12">
                    <div style={{ display: 'flex' }}>
                      <button
                        onClick={handleCheck}
                        className="ml-3"
                        style={{
                          padding: '10px 20px',
                          marginLeft: '30px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        Check
                      </button>
                      {selectedCustomScreener ? (
                        <button
                          onClick={handleUpdate}
                          className="mr-3"
                          style={{
                            padding: '10px 20px',
                            marginLeft: '30px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          Update
                        </button>
                      ) : (
                        <button
                          onClick={handleSave}
                          className="mr-3"
                          style={{
                            padding: '10px 20px',
                            marginLeft: '30px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          Save
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="additional-content" id="entry1">
              <div className="container">
                <div className="left-section">
                  <label htmlFor="Select Gate">
                    {' '}
                    <strong style={{ fontSize: '17px' }}>
                      Select Condition{' '}
                    </strong>
                  </label>
                  <select
                    id="gate"
                    value={gate}
                    onChange={(e) => setGate(e.target.value)}
                  >
                    <option value="and">AND</option>
                    <option value="or">OR</option>
                  </select>
                </div>
                <div className="right-section">
                  <label>
                    <strong style={{ fontSize: '17px' }}>
                      Custom Screener:
                    </strong>{' '}
                  </label>
                  <div style={{ marginLeft: '7px', paddingTop: '1px' }}>
                    <Select
                      styles={customStylesContracts}
                      placeholder="Select a screener"
                      options={customScreenerOptions}
                      onChange={handleCustomScreenerChange}
                      value={
                        selectedCustomScreener
                          ? {
                              label: selectedCustomScreener,
                              value: selectedCustomScreener,
                            }
                          : null
                      }
                    />
                  </div>
                </div>
              </div>

              {currentCustomScreenerData.length === 0 ? (
                <div>
                  {dynamicColumns}
                  <div style={{ marginLeft: '20px' }}>
                    <div className="container" style={{ marginTop: '-10px' }}>
                      <div className="left-section-screener">
                        <button onClick={addRow}>+</button>
                      </div>
                      <div className="right-section"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {dynamicColumns2}
                  <div style={{ marginLeft: '20px' }}>
                    <div className="container" style={{ marginTop: '-10px' }}>
                      <div className="left-section-screener">
                        <button onClick={addRow}>+</button>
                      </div>
                      <div className="right-section">
                        <button
                          onClick={handleDelete}
                          // disabled={isButtonDisabled}
                          style={{
                            padding: '5px 10px',
                            marginLeft: '10px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          Delete Screener
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showChart && (
            <CSGraph
              finalResult={finalResult}
              indicatorValues={indicatorValues}
              historicalData={historicalData}
              interval={interval}
              finalLag={finalLag}
              type={type}
              selectedContract={selectedContract}
            />
          )}
        </>
      )}
    </div>
  );
};

const customStylesContracts = {
  control: (provided) => ({
    ...provided,
    width: 250, // Set your fixed width
    height: 30, // Set your fixed height
    minHeight: '30px', // Adjust the height of the input field
    fontSize: '16px', // Adjust the font size of the input text
    overflow: 'hidden',
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: '30px',
    padding: '0 6px',
    overflow: 'hidden',
  }),
  input: (provided) => ({
    ...provided,
    margin: '0px',
    padding: '0px',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '30px',
  }),
  option: (provided) => ({
    ...provided,
    fontSize: '14px', // Adjust the font size of the text inside the dropdown menu
  }),
  singleValue: (provided) => ({
    ...provided,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  }),
};

export default CustomScreeners;
