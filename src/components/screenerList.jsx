import { useMsal } from '@azure/msal-react';
import { Box, TextField } from '@mui/material';
import Button from '@mui/material/Button';
// import { Button } from "primereact/button";
import { Checkbox } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SelectedScreeners from './selectedScreeners';
import {Paper} from '@mui/material';

const getImpulses = require('../Scanners/impulse');

let BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ScreenerList = ({
  product, // product
  subProduct, // array of selected Contracts from productList
  selectedTimeFrame, // timeFrame
  watchLists, // complete watchList
  setWatchLists, // function to update the state of watchlists
  selectedWatchlist, // selected one
  setSelectedWatchlist, // function to update the state of selectedWatchlist
  screeners, // the available screeners i receive from the backend
  setScreeners, // to update the state of screeners available from the backend including the cutsom ones
  selectedScreeners, // the selected screeners by the user
  setSelectedScreeners, // this is the function to update the selcted Screeners
  handleScreenerSelect, // this is the function to handle the screeners selected by the user
  lookBackPeriod, // state to store the lookBackPeriod
  setLookBackPeriod, // function to update the lookBackPeriod
  showCustomScreener, // to show the custom screener
  setShowCustomScreener, // function to update the state of showCustomScreener
  customScreeners, // to store the custom screener
  setCustomScreeners, // function to update the state of customScreener
  userId, // stores the current user microsoft id
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [screenerResults, setScreenerResults] = useState([]); // to store the screener Results coming from the backedn, this is the one without the lookBackPeriod

  const [loading, setLoading] = useState(false); // loading State to get to know whether we have received the data from backend or not

  const [signalsData, setSignalsData] = useState([]); // this gives the bullish/bearish signs from the backend, with the selected lookBackPeriod

  const [historicalData, setHistoricalData] = useState([]); // stores the ohlc data for all contracts, this is the one when watchList is not selected, so historicalData will go away if product is changed.

  const [closingPrices, setClosingPrices] = useState({}); // to store the closing prices for all contracts of the selected watchList

  const [customScreenersData, setCustomScreenersData] = useState([]); // selected Custom screeners data from the backend

  // for the azure authentication with only hertshtengroup
  const { instance } = useMsal(); // creating instance
  const { accounts } = useMsal(); // to access the details of the current logged in user

  const [watchListUpdate, setWatchListUpdate] = useState(false);

  const navigate = useNavigate();

  // const handleCustomScreenerClick = () => {
  //   navigate("/custom-screeners");
  // };

  const handleCustomScreenerClick = () => {
    const customScreenerWindow =  window.open('/custom-screeners', '_blank');
    if(customScreenerWindow) {
      customScreenerWindow.onload = () => {
        customScreenerWindow.document.title = 'Custom-Screener';
      }
    }
  };

  const toggleCustomScreener = () => {
    setShowCustomScreener(!showCustomScreener);
  };

  // Remove contract data from historicalData if the contract is clicked again
  const handleContractClick = (contract) => {
    setHistoricalData((prevData) =>
      prevData.filter((item) => item.contract !== contract),
    );
  };

  // handling search bar for this compoent to search for screeners
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // this is to clear the selected screeners when we switch between the watchLists
  useEffect(() => {
    setSelectedScreeners([]);
  }, [selectedWatchlist]);

  // to call the api every 15 minutes
  // useEffect(() => {
  //   console.log("Calling data again after 15 mins of interval");
  //   const intervalId = setInterval(() => {
  //     // Call the API every 15 minutes
  //     handleScanButtonClick();
  //     // console.log(product);
  //   }, 1 * 60 * 1000); // 15 minutes in milliseconds

  //   // Cleanup function to clear the interval when the component unmounts
  //   return () => clearInterval(intervalId);
  // }, [product, subProduct, selectedTimeFrame, selectedScreeners]);

  // handling scan button when watchList is selected as well as not selected, both the logic into one

  const handleScanButtonClick = async () => {
    console.log('scan button clicked');
    setLoading(true); // Set loading state to true when scan button is clicked

    // when watchlist is selected
    try {
      let updatedWatchlist = selectedWatchlist;

      if (selectedWatchlist.length !== 0) {
        if (watchListUpdate === true) {
          setWatchListUpdate(false);

          const watchlist_name = selectedWatchlist.name;
          const apiUrl = `${BASE_URL}/watchlist/get_one/${userId}/${watchlist_name}`;

          // Fetch data from the backend
          try {
            const response = await fetch(apiUrl, {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            });

            if (!response.ok) {
              throw new Error('Failed to fetch data from the backend');
            }

            updatedWatchlist = await response.json();
            console.log(updatedWatchlist);
            setSelectedWatchlist(updatedWatchlist);
          } catch (error) {
            console.error(error);
          }
        }

        // Extract contracts and screeners from the updated watchlist
        const { contracts } = updatedWatchlist; // destructuring updated watchlist

        const fetchedHistoricalData = [];
        const fetchedSignalsData = [];
        const fetchedScreenerResults = [];
        const fetchedClosingPrices = {}; // storing closing prices of all contracts in the watchlists to pass the screeners

        // Loop over each contract group in the watchlist
        for (const contractGroup in contracts) {
          // If the contract group does not have fetched closing prices, initialize it
          if (!fetchedClosingPrices[contractGroup]) {
            fetchedClosingPrices[contractGroup] = [];
          }

          // Get the list of subContracts in the current contract group
          const subContracts = contracts[contractGroup];

          // Map the subContracts to a query string
          const subContractParams = subContracts
            .map((c) => `contracts=${c}`)
            .join('&');

          // Way to send the screeners data to the backend
          const screenersQueryString = updatedWatchlist.screeners
            .map((screener) => `screeners=${screener}`)
            .join('&');

          // API URL for fetching historical data
          const histApiURL = `${BASE_URL}/historicalData/${contractGroup}?${subContractParams}&time_frame=${selectedTimeFrame}`;

          try {
            // Fetch historical data
            // const histResponse = await fetch(histApiURL, {
            //     headers: {
            //         "ngrok-skip-browser-warning": "true", // Set and send ngrok-skip-browser-warning header
            //     },
            // });

            // const histData = await histResponse.json();
            // subContracts.forEach((subContract, index) => {
            //     fetchedHistoricalData.push({
            //         contract: subContract,
            //         data: histData[index].reverse(),
            //     });

            //     // storing closing prices in the object defined
            //     const closingPrice = histData[index].map((item) => item.Close);
            //     fetchedClosingPrices[contractGroup].push(closingPrice);
            // });

            // API URL for fetching screener results
            const screenerApiURL = `${BASE_URL}/screenerlist/apply_screeners?product=${contractGroup}&${subContractParams}&${screenersQueryString}&time_frame=${selectedTimeFrame}`;

            // Fetch screener results
            const screenerResponse = await fetch(screenerApiURL, {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            });

            const screenersResults = await screenerResponse.json();
            fetchedScreenerResults.push(screenersResults);

            // API URL for fetching signals data
            const signalsApiURL = `${BASE_URL}/screenerlist/apply_screeners?product=${contractGroup}&${subContractParams}&${screenersQueryString}&time_frame=${selectedTimeFrame}&lookBackPeriod=${lookBackPeriod}`;

            // Fetch signals data
            const signalsResponse = await fetch(signalsApiURL, {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            });

            const signalsData = await signalsResponse.json();
            fetchedSignalsData.push(signalsData);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        }

        // Update state with fetched historical data and signals data
        setHistoricalData(fetchedHistoricalData);
        setSignalsData(fetchedSignalsData);
        setScreenerResults(fetchedScreenerResults);
        setClosingPrices(fetchedClosingPrices);
      } else {
        // If no watchlist is selected, follow the original flow
        // Perform the existing logic to fetch data

        const fetchedHistoricalData = []; // to store the ohlc data for all selected contracts
        const fetchedClosingPrices = {}; // to store the closing prices for all selected contracts

        // subProduct is the array of selected contracts from the product array
        for (let i = 0; i < subProduct.length; i++) {
          const contract = subProduct[i];
          if (!fetchedClosingPrices[contract]) {
            fetchedClosingPrices[contract] = [];
          }

          const histResponse = await fetch(
            `${BASE_URL}/historicalData/${product}/${contract}?time_frame=${selectedTimeFrame}`,
            {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            },
          );

          const histData = await histResponse.json();
          fetchedHistoricalData.push({
            contract: contract,
            data: histData.reverse(),
          });

          const closingPrice = [];
          for (let i = 0; i < histData.length; i++) {
            closingPrice.push(histData[i].Close);
          }

          fetchedClosingPrices[contract].push(closingPrice);
        }
        setClosingPrices(fetchedClosingPrices);

        // handling screeners as well as custom screeners to be sent to the backend
        const apiEndpoint = `${BASE_URL}/screenerlist/apply_screeners`;

        // Separate default and custom screeners
        let default_screeners = selectedScreeners.filter(
          (screener) =>
            screeners.find((s) => s.symbol === screener)?.custom === false,
        );

        const screenerParams = default_screeners.map(
          (screener) => `screeners=${screener}`,
        );
        const subProudctParams = subProduct.map(
          (contract) => `contracts=${contract}`,
        );

        const apiURL = `${apiEndpoint}?product=${
          product || ''
        }&${subProudctParams.join('&')}&${screenerParams.join(
          '&',
        )}&time_frame=${selectedTimeFrame}`;

        // Fetch screener results
        try {
          if (default_screeners.length > 0) {
            const response = await fetch(apiURL, {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            });
            if (!response.ok) {
              throw new Error('Failed to fetch data from the backend');
            }
            const data = await response.json();
            setScreenerResults(data);
            console.log('Screener results:', data);
          }
        } catch (error) {
          console.error('Error:', error.message);
        }

        const signalsEndpoint = `${BASE_URL}/screenerlist/apply_screeners`;
        const signalsAPIURL = `${signalsEndpoint}?product=${
          // to handle product was null or not
          product || ''
        }&${subProudctParams.join('&')}&${screenerParams.join(
          '&',
        )}&time_frame=${selectedTimeFrame}&lookBackPeriod=${lookBackPeriod}`;
        if (default_screeners.length > 0) {
          try {
            // Fetch signals data

            const signalsResponse = await fetch(signalsAPIURL, {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            });
            if (!signalsResponse.ok) {
              throw new Error('Failed to fetch signals data from the backend');
            }
            const signalsData = await signalsResponse.json();
            console.log('Signals data:', signalsData);
            setSignalsData(signalsData);
          } catch (error) {
            console.error('Error:', error.message);
          } finally {
            setLoading(false); // setLoading back to false after fetching is done
          }
        }
      }

      // Clear loading state
      setLoading(false);
    } catch (error) {
      console.error('Error:', error.message);
      // Handle error and clear loading state
      setLoading(false);
    }

    let custom_screeners = selectedScreeners.filter(
      (screener) =>
        screeners.find((s) => s.symbol === screener)?.custom === true,
    );

    // handling for custom_screeners as well to get their blocks data
    if (custom_screeners.length > 0) {
      let fetchedCustomScreenersData = [];
      for (let i = 0; i < custom_screeners.length; i++) {
        const current_custom_screener = custom_screeners[i];
        const custom_apiURL = `${BASE_URL}/screenerlist/get_custom_screener_by_name?user_id=${userId}&custom_screener_name=${current_custom_screener}`;
        try {
          const response = await fetch(custom_apiURL, {
            headers: {
              'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch data from the backend');
          }
          const custom_data = await response.json();
          console.log('Custom screener results:', custom_data);
          fetchedCustomScreenersData.push(custom_data);
        } catch (error) {
          console.error('Error:', error.message);
        }
      }

      setCustomScreenersData(fetchedCustomScreenersData);
    }
  };

  useEffect(() => {
    if (selectedWatchlist.length !== 0) {
      if (screenerResults.length !== 0 && signalsData.length !== 0) {
        console.log('screener Results', screenerResults);
        console.log('signals Data', signalsData);
      }
    }
    // any one dependency will work as it will enter the useEffect to console then
  }, [selectedWatchlist, screenerResults]);

  // functioanlity to search for screeners in the lower case
  const filteredScreeners = screeners.filter((screener) =>
    screener.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // handling screeners related data
  const screenersData = filteredScreeners.map((screener, index) => ({
    id: index + 1,
    screenerName: screener.symbol,
    screenerDescription: screener.explanation,
  }));

  // this is to clear the selected screeners when we switch between the watchLists
  useEffect(() => {
    setSelectedScreeners([]);
  }, [selectedWatchlist]);

  const columns = [
    {
      field: 'select',
      headerName: 'Select',
      renderCell: (params) => (
        <Checkbox
          checked={selectedScreeners.includes(params.row.screener)}
          onChange={() => handleScreenerSelect(params.row.screener)}
        />
      ),
      width: 90,
    },
    { field: 'screener', headerName: 'Screener', width: 150 },
    { field: 'description', headerName: 'Screener Description', width: 350 },
  ];

  const rows = [
    {
      id: 6,
      screener: 'imp',
      description: 'Chart Pattern for Impulse and then Consolidate',
    },
    {
      id: 7,
      screener: 'inv_imp',
      description: 'Chart Pattern for Inverse Impulse and then Consolidate',
    },
    { id: 5, screener: 'fp', description: 'Chart Pattern for Flag Pattern' },
    {
      id: 1,
      screener: 'hs',
      description: 'Chart Pattern for Head and Shoulder',
    },
    {
      id: 2,
      screener: 'ihs',
      description: 'Chart Pattern for Inverse Head and Shoulder',
    },
    { id: 3, screener: 'db', description: 'Chart Pattern for Double Bottom' },
    { id: 4, screener: 'dt', description: 'Chart Pattern for Double Top' },
  ];

  return (
      <Paper>
      <Box
        sx={{
          position: 'fixed',
          bottom: 10,
          left: 18,
          width: '35.5vw',
          height: '42vh',
          p: 2,
          bgcolor: 'background.paper',
          boxShadow: 1,
          borderRadius: 1,
        }}
      >
        <Box
        
          sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
        >
          <TextField
            placeholder="Search Screeners"
            id="outlined-basic"
            label="Search Screeners"
            variant="outlined"
            size="small"
            sx={{ mr: 1 }}
          />

          <TextField
            type="number"
            inputProps={{ min: 1 }}
            label="LookBack Period"
            variant="outlined"
            size="small"
            value={lookBackPeriod}
            sx={{ width: 175, mr: 1 }}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setLookBackPeriod(isNaN(value) || value < 1 ? 1 : value);
            }}
          />
          <Button
            variant="contained"
            sx={{ flexGrow: 1, mr: 1 }}
            onClick={handleCustomScreenerClick}
          >
            CUSTOM SCREENER
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleScanButtonClick}
            disabled={loading}
          >
            SCAN
          </Button>
        </Box>
        <Box sx={{ height: '90%', width: '100%' }}>
          <DataGrid style={{fontSize: '14.5px'}}  rows={rows} columns={columns} hideFooter />
        </Box>
     

      <SelectedScreeners
        product={product}
        subProduct={subProduct}
        screener={selectedScreeners}
        screenerResults={screenerResults}
        setScreenerResults={setScreenerResults}
        selectedTimeFrame={selectedTimeFrame}
        signalsData={signalsData}
        watchLists={watchLists}
        setWatchLists={setWatchLists}
        setWatchListUpdate={setWatchListUpdate}
        selectedWatchlist={selectedWatchlist}
        historicalData={historicalData}
      />
    </Box>
    </Paper>
  );
};

export default ScreenerList;
