import { React, useEffect, useState, useMemo } from 'react';
import Graph from './graph';
import { Box } from '@mui/material';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import { useMsal } from '@azure/msal-react';
import { DataGrid } from '@mui/x-data-grid';
import { Checkbox } from '@mui/material';
import { Button } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { red } from '@mui/material/colors';
// import CloseIcon from '@mui/icons-material/Close';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import axios from 'axios';

// Add your styles
const StyledDataGrid = styled(DataGrid)({
  '.MuiDataGrid-cell--stickyRight': {
    position: 'sticky',
    right: 0,
    backgroundColor: '#fff', // Ensure the background matches your table
    zIndex: 1,
  },
});


let BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SelectedScreeners = ({
  product, // the selceted product
  subProduct, // stores the selected contracts of the product from the productList, this is an array and this is when no watchlist is selected
  screener, // the selected screeners by the user
  screenerResults, // the screeners plot result from the backend
  setScreenerResults, // function to update the screenerResults
  selectedTimeFrame, // time Frame selcted
  signalsData, // the bullish/bearish one data from the backend
  watchLists, // complete watchLists structure
  setWatchListUpdate, // to update the state of watchListUpdate
  setWatchLists, // function to update the state of watchlists
  selectedWatchlist, // selectedWatchList
}) => {
  const [selectedContract, setselectedContract] = useState(null); // selected contract for which graph has to be deployed
  const [selectedScreener, setSelectedScreener] = useState(null); // selected screener that will be displayed on the graph
  const [prevProduct, setPrevProduct] = useState(null); // this was done inorder to compare the new updated value with the prev one
  const [contractDataChanges, setContractDataChanges] = useState({}); // storing the signals data
  const [prevSignalsData, setPrevSignalsData] = useState(null);
  const [prevScreenerResults, setPrevScreenerResults] = useState(null);
  const [loading, setLoading] = useState(true); // laoding state updating for the data receiving from the backend
  const [hoveredScreener, setHoveredScreener] = useState(null);
  const { accounts } = useMsal(); // to access the details of the user

  useEffect(() => {
    setPrevSignalsData(signalsData);
    setPrevScreenerResults(screenerResults);
    setLoading(false); // set Loading to false when data is received
  }, [signalsData, screenerResults]);

  const uniqueSubProducts = [...new Set(subProduct)];
  const contracts = uniqueSubProducts.map((contract, index) => ({
    id: index + 1,
    contract,
  }));

  useEffect(() => {
    setSelectedScreener(null);
    setselectedContract(null);
    setPrevProduct(product);
    setContractDataChanges({});
  }, [product, selectedTimeFrame]);

  useEffect(() => {
    if (product === prevProduct) {
      return;
    }

    setPrevProduct(product);
    setContractDataChanges({});
  }, [product, prevProduct]);

  useEffect(() => {
    const newContractDataChanges = {};
    contracts.forEach(({ contract }) => {
      const prevData = contractDataChanges[contract] || {};
      const newData = signalsData[contract] || {};
      const hasChanges = JSON.stringify(prevData) !== JSON.stringify(newData);
      if (hasChanges) {
        newContractDataChanges[contract] = newData;
      }
    });
    setContractDataChanges({
      ...contractDataChanges,
      ...newContractDataChanges,
    });
  }, [signalsData]);

  // const handleContractSelect = (contract) => {
  //   console.log(contract);
  //   console.log(selectedContract);

  //   if(selectedContract == null) {
  //     setselectedContract(contract);
  //   }
  //   else if(selectedContract == contract ) {
  //     setselectedContract(null);
  //   }
  //   else {
  //     setselectedContract(contract);
  //   }

  //   // setselectedContract(contract === selectedContract ? null : contract);
  //   console.log('The selected contract  now is : ',selectedContract);



  //   setSelectedScreener(null);
  // };

  const handleContractSelect = (contract) => {
    setselectedContract(prev => (prev === contract ? null : contract));
    setSelectedScreener(null);
  };
  

  const handleScreenerSelect = (screener) => {
    console.log('the selected screener is : ', screener);
    setSelectedScreener(screener === selectedScreener ? null : screener);
  };

  const getCellValue = (contractObject, screener) => {
    if (selectedWatchlist.length === 0) {
      //function to display the updated bullish or bearish signals on the contract for that screener

      const contract = contractObject?.contract;
      // console.log('the current a contract is : ', contract)
      // console.log('the signals Data is : ', signalsData)

      const currentData = signalsData?.[contract]?.[screener];
      const prevData = prevSignalsData?.[contract]?.[screener];

      // console.log('Printing data for current Data and prev Data', currentData, prevData);

      const currentTimestampArray = screenerResults?.[contract]?.[screener];
      const prevTimestampArray = prevScreenerResults?.[contract]?.[screener];

      // console.log('The timestamps are : ', currentTimestampArray, prevTimestampArray)

      // let len1, len2; // not required as I am getting the last ones on to the first index, checked by consoling
      let currentTimestampArray2, prevTimestampArray2;
      let currentTimestamp, prevTimestamp;

      if (currentTimestampArray) {
        // len1 = currentTimestampArray.length;
        currentTimestampArray2 = currentTimestampArray[0];
        currentTimestamp = currentTimestampArray2?.[0]?.Date;
      }

      if (prevTimestampArray) {
        // len2 = prevTimestampArray.length;
        prevTimestampArray2 = prevTimestampArray[0];
        prevTimestamp = prevTimestampArray2?.[0]?.Date;
      }

      // console.log('The timestamps are : ',currentTimestamp,currentTimestamp,prevTimestamp,prevTimestamp);
      // console.log("currentData !== prevData", currentData !== prevData)
      if (
        (prevData && currentData !== prevData) ||
        (prevTimestamp && currentTimestamp !== prevTimestamp)
      ) {
        // If data has changed or new pattern detected, highlight with yellow (#ffff99)
        return (
          // highlight
          <span
            style={{
              backgroundColor: '#ffff99',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentData === 1 ? (
              <span
                style={{
                  color: 'green',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ▲
              </span>
            ) : currentData === -1 ? (
              <span
                style={{
                  color: 'red',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ▼
              </span>
            ) : (
              ''
            )}
          </span>
        );
      } else if (!prevData || currentData === prevData) {
        return (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {currentData === 1 ? (
              <span
                style={{
                  color: 'green',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {' '}
                ▲{' '}
              </span>
            ) : currentData === -1 ? (
              <span
                style={{
                  color: 'red',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {' '}
                ▼{' '}
              </span>
            ) : (
              ''
            )}
          </span>
        );
      } else {
        return ''; // returns nothing
      }
    }
  };

  const rows = contracts.map((contract, index) => ({
    id: index,
    subProduct: contract.contract,
    ...contract,
  }));

  

  const baseColumns = [
    {
      field: 'select',
      headerName: 'Select',
      renderCell: (params) => (
        <Checkbox
          checked={selectedContract === params.row.contract}
          onChange={() => handleContractSelect(params.row.contract)}
        />
      ),
      sortable: false,
      // width: 100,
    },
    {
      field: 'contract',
      headerName: `Contracts [${selectedTimeFrame}]`,
      width: 200,
      headerAlign: 'left',
      sortable: false,
    },
  ];
  
  const screenerColumns = screener.map((screener) => ({
    field: screener,
    headerName: screener,
    width: 140,
    renderHeader: () => (
      <Button
        variant="contained"
        sx={{
          color: selectedScreener === screener ? '#000000' : '#FFFFFF',
          backgroundColor: selectedScreener === screener ? '#ff6347' : '#3399ff',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '6px 12px',
          textTransform: 'none',
          borderRadius: '4px',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
        
          '&:focus': {
            outline: 'none',
            boxShadow: '0px 0px 10px 2px rgba(0, 0, 0, 0.2)',
          },
         
        }}
        onClick={() => handleScreenerSelect(screener)}
      >
        {screener}
      </Button>
    ),
    renderCell: (params) => getCellValue(params.row, screener),
    headerAlign: 'center',
    sortable: false,
  }));
  
  const columns = [...baseColumns, ...screenerColumns];
  

  // Function to display the updated bullish or bearish signals on the contract for that screener
  const getCellValue_two = (contractObject, screener) => {
    if (selectedWatchlist.length !== 0) {
      const contract = contractObject?.contract;

      // console.log(signalsData);

      const contractData = signalsData.find((data) => data[contract]);

      if (contractData) {
        const currentData = contractData[contract][screener];
        const prevData = prevSignalsData?.[contract]?.[screener];
        const currentTimestampArray = screenerResults.find(
          (result) => result[contract],
        );
        const prevTimestampArray = prevScreenerResults?.find(
          (result) => result[contract],
        );

        let currentTimestamp, prevTimestamp;

        if (currentTimestampArray) {
          currentTimestamp = currentTimestampArray[contract][screener][0]?.Date;
        }

        if (prevTimestampArray) {
          prevTimestamp = prevTimestampArray[contract][screener][0]?.Date;
        }

        if (currentData !== prevData || currentTimestamp !== prevTimestamp) {
          // If data has changed or new pattern detected, highlight with yellow (#ffff99)
          return (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentData === 1 ? (
                <span
                  style={{
                    color: 'green',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▲
                </span>
              ) : currentData === -1 ? (
                <span
                  style={{
                    color: 'red',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▼
                </span>
              ) : (
                ''
              )}
            </span>
          );
        } else if (
          currentData === prevData ||
          currentTimestamp === prevTimestamp ||
          !prevData
        ) {
          return (
            <span>
              {currentData === 1 ? (
                <span
                  style={{
                    color: 'green',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▲
                </span>
              ) : currentData === -1 ? (
                <span
                  style={{
                    color: 'red',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ▼
                </span>
              ) : (
                ''
              )}
            </span>
          );
        }
      }

      return ''; // returns nothing
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

  if (selectedWatchlist.length === 0) {
    const uniqueSubProducts = [...new Set(subProduct)];
    const contracts = uniqueSubProducts.map((contract, index) => ({
      id: index + 1,
      contract,
    }));

    return (
      <Box
        sx={{
          position: 'fixed',
          height: ' 39vh',
          width: '60vw',
        
          bottom: 10,
          right: 10,
          backgroundColor: 'background.paper',
          padding: 1,
          boxShadow: 1,
          borderRadius: 1,
          maxHeight: 440,
        
        }}
      >
        <Box style={{ height: 400, width: '100%' }}>
          <DataGrid rows={rows} columns={columns} pageSize={5} hideFooter />
        </Box>

        <Graph
          product={product}
          subProduct={subProduct}
          selectedContract={selectedContract}
          screeners={screener}
          screener={selectedScreener}
          setSelectedScreener={setSelectedScreener}
          screenerResults={screenerResults}
          setScreenerResults={setScreenerResults}
          selectedTimeFrame={selectedTimeFrame}
          watchLists={watchLists}
          selectedWatchlist={selectedWatchlist}
        />
      </Box>
    );
  }

  // this is the one i am returing again, if some watchList is selected then this part of code will get execute and hence watchList component will be displayed here
  const selectedWatchlistData = watchLists.find(
    (list) => list.name === selectedWatchlist.name,
  ); // this is the selected watchList
  // console.log(selectedWatchlistData);
  const selectedContracts = selectedWatchlistData?.contracts || {}; // storing the contracts object here of the watchList
  const selectedContractNames = Object.values(selectedContracts).flat(); // stores the selected contracts of the watchList without the products to be able to display

  const selectedScreeners = selectedWatchlistData?.screeners || []; // storing the screeners here of the watchList

  // Function to delete a contract from the selected watchlist
  const deleteContract = (contractName) => {
    if (!selectedWatchlist) {
      console.error('No watchlist selected');
      return;
    }

    const userData = accounts[0]; // assuming only single user at a time
    let user_id = userData.homeAccountId.split('.')[0];

    let product;
    for (const [productName, contracts] of Object.entries(
      selectedWatchlistData.contracts,
    )) {
      if (contracts.includes(contractName)) {
        product = productName;
        break;
      }
    }

    if (!product) {
      console.error('Product not found for the contract');
      return;
    }

    // Construct the delete endpoint URL
    const endpoint = `${BASE_URL}/watchlist/delete/contract/${user_id}/${selectedWatchlist.name}?product=${product}&contract=${contractName}`;

    // making the delete request to remove the contract
    axios
      .delete(endpoint, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
        },
      })
      .then((response) => {
        console.log('Contract deleted successfully:', response.data);
        // Updating the front end immediately after deleting the contract
        const updatedWatchLists = watchLists.map((list) => {
          if (list.name === selectedWatchlist.name && list.contracts) {
            const updatedContracts = { ...list.contracts };
            if (updatedContracts[product]) {
              updatedContracts[product] = updatedContracts[product].filter(
                (contract) => contract !== contractName,
              );
            }
            return { ...list, contracts: updatedContracts };
          }
          return list;
        });
        setWatchLists(updatedWatchLists);
        setWatchListUpdate(true);
      })
      .catch((error) => {
        console.error('Error deleting contract:', error);
      });
  };

  const deleteScreener = (screenerName) => {
    // option avaialble only if watchlist is selected
    if (!selectedWatchlist) {
      console.error('No watchlist selected');
      return;
    }

    const userData = accounts[0]; // assuming only single user at a time
    const user_id = userData.homeAccountId.split('.')[0];

    // Construct the delete endpoint URL
    const endpoint = `${BASE_URL}/watchlist/delete/screener/${user_id}/${selectedWatchlist.name}?screener=${screenerName}`;

    console.log(
      `${BASE_URL}/watchlist/delete/screener/${user_id}/${selectedWatchlist.name}?screener=${screenerName}`,
    );

    const options = {
      // Add any headers you need
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
      },
    };

    // Making the delete request to remove the screener
    axios
      .delete(endpoint, options, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
        },
      })
      .then((response) => {
        console.log('Screener deleted successfully:', response.data);
        // Updating the front end immediately after deleting the screener
        const updatedWatchLists = watchLists.map((list) => {
          if (list.name === selectedWatchlist.name) {
            return {
              ...list,
              screeners: list.screeners.filter(
                (screener) => screener !== screenerName,
              ),
            };
          }
          return list;
        });
        setWatchLists(updatedWatchLists);
        setWatchListUpdate(true);
      })
      .catch((error) => {
        console.error('Error deleting screener:', error);
      });
  };

  // these two needs to be there when we want the bin icon on hovering of screeners in the watchlist
  // const handleMouseEnter = (screener) => {
  //   setHoveredScreener(screener);
  // };

  // const handleMouseLeave = () => {
  //   setHoveredScreener(null);
  // };

  // const WatchListcolumns = [
  //   {
  //     field: 'select',
  //     headerName: 'Select',
  //     width: 100,
  //     renderCell: (params) => (
  //       <Checkbox
  //         checked={selectedContract === params.row.contract}
  //         onChange={() => handleContractSelect(params.row.contract)}
  //       />
  //     ),
  //     sortable: false,
  //   },
  //   {
  //     field: 'contract',
  //     headerName: `Contracts [${selectedTimeFrame}]`,
  //     width: 180,
  //     sortable: false,
  //   },
  //   ...selectedScreeners.map((screener, index) => ({
  //     field: `screener_${index}`,
  //     headerName: (
  //       <stack>
  //          <Button
  //       variant="contained"
  //       sx={{
  //         color: selectedScreener === screener ? '#000000' : '#FFFFFF', // Change text color based on selection
  //         backgroundColor: selectedScreener === screener ? '#ff6347' : '#2d53b5', // Change background color based on selection
  //         '&:hover': {
  //           backgroundColor: selectedScreener === screener ? '#e55347' : '#032d87', // Different hover color if selected
  //         },
  //       }}
  //       onClick={() => handleScreenerSelect(screener)}
  //     >
  //       {screener}
  //       </Button>
  //         <CloseRoundedIcon
  //           onClick={() => deleteScreener(screener)}
  //           variant="contained"
  //           sx={{ color: red[500], pt: 0 }}
  //         >
  //           {/* <Button fontSize="large" color="error" sx={{pt: "10"}} /> */}
  //         </CloseRoundedIcon>
  //       </stack>
  //     ),
  //     sortable: false,
  //     width: 120,
  //     renderCell: (params) => getCellValue_two(params.row, screener),
  //   })),
  //   {
  //     field: 'actions',
  //     headerName: '',
  //     width: 80,
  //     sortable: false,
  //     renderCell: (params) => (
  //       <CloseRoundedIcon
  //         onClick={() => deleteContract(params.row.contract)}
  //         fontSize="medium"
  //         sx={{ color: red[500], pt: 1 }}
  //       ></CloseRoundedIcon>
  //     ),
  //   },
  // ];

  const WatchListcolumns = [
    {
      field: 'select',
      headerName: 'Select',
      width: 100,
      renderCell: (params) => (
        <Checkbox
          checked={selectedContract === params.row.contract}
          onChange={() => handleContractSelect(params.row.contract)}
        />
      ),
      sortable: false,
    },
    {
      field: 'contract',
      headerName: `Contracts [${selectedTimeFrame}]`,
      width: 180,
      sortable: false,
      headerClassName: 'header-style', // Apply custom header class
    },
    ...selectedScreeners.map((screener, index) => ({
      field: `screener_${index}`,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
           variant="contained"
            sx={{
              color: selectedScreener === screener ? '#000000' : '#FFFFFF',
              backgroundColor: selectedScreener === screener ? '#ff6347' : '#3399ff',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '6px 12px',
              textTransform: 'none',
              borderRadius: '4px',
              boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
            
              '&:focus': {
                outline: 'none',
                boxShadow: '0px 0px 10px 2px rgba(0, 0, 0, 0.2)',
              },
             
            }}
            onClick={() => handleScreenerSelect(screener)}
          >
            {screener}
          </Button>
          <CloseRoundedIcon
            onClick={() => deleteScreener(screener)}
            variant="contained"
            sx={{
              color: red[500],
              marginLeft: '8px',
              cursor: 'pointer',
              '&:hover': {
                color: red[700],
              },
            }}
          />
        </Box>
      ),
      sortable: false,
      width: 140,
      renderCell: (params) => getCellValue_two(params.row, screener),
      headerClassName: 'header-style', // Apply custom header class
    })),
    {
      field: 'actions',
      headerName: '',
      width: 50,
      renderCell: (params) => (
        <CloseRoundedIcon
          onClick={() => deleteContract(params.row.contract)}
          variant="contained"
          sx={{
            color: red[500],
            cursor: 'pointer',
            '&:hover': {
              color: red[700],
            },
          }}
        />
      ),
      sortable: false,
      headerClassName: 'header-style', // Apply custom header class
      cellClassName: 'sticky-right', // Apply stickyRight class to the last column
    },
  ];

  const WatchListrows = selectedContractNames.map((contract, index) => ({
    id: index + 1,
    contract,
  }));

  return (
    <Box
      sx={{
        position: 'fixed',
        height: '39vh',
        width: '60vw',
        bottom: 15,
        right: 10,

      
        backgroundColor: 'background.paper',
        padding: 1,
        boxShadow: 1,
        borderRadius: 1,
      }}
    >
      <StyledDataGrid rows={WatchListrows} columns={WatchListcolumns} disableSelectionOnClick  hideFooter/>
      <Graph
        product={product}
        subProduct={subProduct}
        selectedContract={selectedContract}
        screeners={screener}
        screener={selectedScreener}
        setSelectedScreener={setSelectedScreener}
        screenerResults={screenerResults}
        setScreenerResults={setScreenerResults}
        selectedTimeFrame={selectedTimeFrame}
        watchLists={watchLists}
        selectedWatchlist={selectedWatchlist}
        selectedContractNames={selectedContractNames}
      />
    </Box>
  );
};

export default SelectedScreeners;
