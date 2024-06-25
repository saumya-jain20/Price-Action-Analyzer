import { useMsal } from '@azure/msal-react';
import { Checkbox, Grid, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import '../App.css';
import ScreenerList from './screenerList';
import { Paper } from '@mui/material';
import { Typography } from '@mui/material';

let BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ProductList = ({ onDataSelect }) => {
  // state for current user, related to watchlists
  const [userId, setUserId] = useState(null);

  // states for all the products
  const [productList, setProductList] = useState([]); // array list to store all the products avaialble
  const [selectedProduct, setSelectedProduct] = useState('CL'); // state for current selected product
  const [subProducts, setSubProducts] = useState([]); // array list to store all the contracts of selected product
  const [subProductsUpdated, setSubProductsUpdated] = useState(false); // loading state for ref
  const [subProductDetails, setSubProductDetails] = useState([]); // all details of the subProducts of the selected product
  const [originalSubProductDetails, setOriginalSubProductDetails] = useState(
    [],
  );
  const [subProductRowsData, setsubProductRowsData] = useState([]);
  const [selectedSubProducts, setSelectedSubProducts] = useState([]); // array list to store selected subProducts

  // state for loading and notLoading
  const [loading, setLoading] = useState(false);

  // state for updating the search bars
  const [searchText, setSearchText] = useState('');

  // state for updating the timeFrame
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('15min');

  // state for watchLists feature
  const [watchLists, setWatchLists] = useState([]); // users all watchLists
  const [selectedWatchlist, setSelectedWatchlist] = useState([]); // selected Watchlist from the user's watchLists
  const [selectedWatchlistName, setSelectedWatchlistName] = useState(null); // name of the selectedWacthlist
  const [showNewWatchlistInput, setShowNewWatchlistInput] = useState(false); // to create a watchList or not
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showAddBtn, setShowAddBtn] = useState(true);
  const [watchlistOptions, setWatchlistOptions] = useState([]); // to get the watchLists from the backend

  // state for showing whether user is logged in or not, before creating a watchList
  const [errorMessage, setErrorMessage] = useState(''); // State to hold error message

  // state for the screeners
  const [screeners, setScreeners] = useState([]); // to store all the available screeners i receive from the backend
  const [selectedScreeners, setSelectedScreeners] = useState([]); // to store the current selected screeners
  const [customScreeners, setCustomScreeners] = useState([]); // to store the custom screeners

  // state for lookBack Period
  const [lookBackPeriod, setLookBackPeriod] = useState(100);

  // state to show/hide the custom screener
  const [showCustomScreener, setShowCustomScreener] = useState(false);

  // for the azure authentication with only hertshtengroup
  const { instance } = useMsal(); // creating instance
  const { accounts } = useMsal(); // to access the details of the current logged in user

  // user authentication part from azure auth
  useEffect(() => {
    const fetchUserDataAndWatchlists = async () => {
      // single tenant, allows only hertshtengroup users to login and access
      //   const userData = accounts[0]; // Assuming only one account is logged in, so I will   access the user at 0th index
      const userData = accounts[0];
      if (userData) {
        let user_Id = userData.homeAccountId.split('.')[0]; // Extracting unique ID
        setUserId(user_Id);
        const userDataToSend = {
          user_id: userData.homeAccountId.split('.')[0],
          email_id: userData.username,
          name: userData.name,
        };
        console.log(userData);
        try {
          const userResponse = await axios.post(
            `${BASE_URL}/user/`,
            userDataToSend,
            {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            },
          );
          console.log('User data sent successfully:', userResponse.data);
          const watchlistsResponse = await axios.get(
            `${BASE_URL}/watchlist/get_all/${userDataToSend.user_id}`,
            {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            },
          );
          const watchlistsData = watchlistsResponse.data;
          console.log('Retrieved watchlists data:', watchlistsData);
          setWatchLists(watchlistsData);
          const watchlistOptions = watchlistsData.map((watchlist) => ({
            label: watchlist.name,
            value: watchlist.name,
          }));
          setWatchlistOptions(watchlistOptions);
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };
    fetchUserDataAndWatchlists();
  }, [accounts]);

  // fetching part from the backend
  // fetching products

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/watchlist/products`, {
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        });
        // console.log(`${BASE_URL}`)
        const formattedProducts = response.data.map((product) => ({
          label: product,
          value: product,
        }));
        setProductList(() => formattedProducts); // functional update
        // console.log("These are the available products: ", response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // fetching contracts of the selected Product
  useEffect(() => {
    const fetchContracts = async () => {
      if (!selectedProduct) return;
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/watchlist/contracts/${selectedProduct}`,
          {
            headers: {
              'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
            },
          },
        );
        setSubProducts(response.data);
        setSubProductsUpdated(true);
        // console.log(
        //   "These are the available contracts of the ",
        //   selectedProduct,
        //   ": ",
        //   response.data
        // );
      } catch (error) {
        console.error('Error fetching contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedProduct) {
      fetchContracts();
    }
  }, [selectedProduct]);

  // able to fetch contract details from the backend without error
  useEffect(() => {
    const fetchSubProductDetails = async () => {
      if (subProducts.length === 0) return;
      setLoading(true);
      try {
        const subProductDetailsPromises = subProducts.map(
          async (subProduct) => {
            const response = await axios.get(
              `${BASE_URL}/watchlist/indicators/${selectedProduct}/${subProduct}?time_frame=${selectedTimeFrame}`,
              {
                headers: {
                  'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
                },
              },
            );
            // console.log(response.data);

            return response.data;
          },
        );
        const fetchedSubProductDetails = await Promise.all(
          subProductDetailsPromises,
        );
        // console.log('Fetched data for subproudct ', fetchedSubProductDetails);

        // console.log(fetchedSubProductDetails);
        // fetchSubProductDetails.push({})

        setSubProductDetails(fetchedSubProductDetails);
        setOriginalSubProductDetails(fetchedSubProductDetails);
      } catch (error) {
        console.error('Error fetching subproduct details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubProductDetails();
  }, [selectedTimeFrame, subProducts]);

  // to calculate ATR
  const ATR = (data, window) => {
    if (data.length < 2 || data.length <= window) {
      return null;
    }

    let TR = [];
    for (let i = 1; i < data.length; i++) {
      let high = data[i]['high'];
      let low = data[i]['low'];
      let close_prev = data[i]['close'];
      let mx = high - low;

      mx = Math.max(mx, Math.abs(high - close_prev));
      mx = Math.max(mx, Math.abs(low - close_prev));

      TR.push(mx);
    }

    let atr = 0;
    for (let i = 0; i < window; i++) {
      atr += TR[i];
    }
    atr = atr / window;

    for (let i = window; i < TR.length; i++) {
      atr = (atr * (window - 1) + TR[i]) / window;
    }

    return atr;
  };

  // to calculate DCW
  const DCW = (data, window) => {
    const n = data.length;

    if (n < window) return null;

    let upper_band = data[n - 1]['high'];
    let lower_band = data[n - 1]['low'];

    for (let i = n - 1; i > n - window - 1; i--) {
      upper_band = Math.max(upper_band, data[i]['high']);
      lower_band = Math.min(lower_band, data[i]['low']);
    }

    let dcw = upper_band - lower_band;
    return dcw;
  };

  const timeFrameOptions = [
    { label: '15 min', value: '15min' },
    { label: '30 min', value: '30min' },
    { label: '45 min', value: '45min' },
    { label: '1 hr', value: '1hr' },
    { label: '2 hr', value: '2hr' },
    { label: '4 hr', value: '4hr' },
    { label: '1 day', value: '1day' },
  ];

  // handling screeners
  useEffect(() => {
    const fetchScreeners = async (userId) => {
      try {
        let url = `${BASE_URL}/screenerlist/get_screeners`;
        if (userId) {
          // means user is logged in
          url += `?user_id=${userId}`;
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
        // console.log("These are the screeners available: ", data);

        let temp_arr = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i].custom === true) {
            temp_arr.push(data[i]);
          }
        }

        setCustomScreeners(temp_arr);
        setScreeners(data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    };

    const checkAndFetchScreeners = () => {
      const activeAccount = instance.getActiveAccount();
      const userId = activeAccount ? activeAccount.localAccountId : null;
      fetchScreeners(userId);
    };

    checkAndFetchScreeners();

    // Re-fetching screeners when userId changes (i.e., user logs in/out)
    if (userId) {
      fetchScreeners(userId);
    }
  }, [instance, showCustomScreener]);

  // handling changes

  // checking the checkbox for the selected contracts
  const handleSubProductCheckboxChange = (subProduct) => {
    setSelectedSubProducts((prevSelected) => {
      const isSelected = prevSelected.includes(subProduct);
      if (isSelected) {
        return prevSelected.filter((selected) => selected !== subProduct);
      } else {
        // setSearchText("");
        return [...prevSelected, subProduct];
      }
    });
  };

  const handleScreenerSelect = (screenerName) => {
    setSelectedScreeners((prevSelected) => {
      const isSelected = prevSelected.includes(screenerName);
      if (isSelected) {
        return prevSelected.filter((selected) => selected !== screenerName);
      } else {
        return [...prevSelected, screenerName];
      }
    });
  };

  // to search for the contracts
  const handleSearchTextChange = (e) => {
    const searchText = e.target.value.toLowerCase();
    setSearchText(searchText);
    if (searchText === '') {
      setSubProductDetails(originalSubProductDetails);
    } else {
      const filteredSubProductDetails = originalSubProductDetails.filter(
        (item) =>
          Object.values(item).some((value) =>
            String(value).toLowerCase().includes(searchText),
          ),
      );
      setSubProductDetails(filteredSubProductDetails);
    }
  };

  /****************************Watchlists functionality**************************************************** */

  const updateWatchList = () => {
    // console.log("entered update btn");
    if (!selectedWatchlist) {
      alert('No watchlist selected, Please select one to continue.');
      return; // Exit the function if no watchlist is selected
    }

    // if (!selectedProduct || !selectedSubProducts) {
    //   alert("Please select product and sub-products to update the watchlist.");
    //   return; // Exit the function if product or sub-products are not selected
    // }

    const updatedWatchLists = [...watchLists];
    const selectedWatchlistIndex = updatedWatchLists.findIndex(
      (watchlist) => watchlist.name === selectedWatchlistName,
    );

    if (selectedWatchlistIndex !== -1) {
      const updatedContracts = {
        ...updatedWatchLists[selectedWatchlistIndex].contracts,
      };

      const productName = selectedProduct;
      const contracts = selectedSubProducts;

      // Ensure the contracts array exists for the selected product
      if (!updatedContracts[productName]) {
        updatedContracts[productName] = [];
      }

      updatedContracts[productName] = [
        ...new Set([...updatedContracts[productName], ...contracts]),
      ];

      // need to change here
      updatedWatchLists[selectedWatchlistIndex].contracts = updatedContracts;

      updatedWatchLists[selectedWatchlistIndex].screeners = [
        ...new Set([
          ...updatedWatchLists[selectedWatchlistIndex].screeners,
          ...selectedScreeners.filter(
            (screener) =>
              !updatedWatchLists[selectedWatchlistIndex].screeners.includes(
                screener,
              ),
          ),
        ]),
      ];

      console.log(updatedWatchLists[selectedWatchlistIndex]);

      // state for storing the user_id = userId.
      updatedWatchLists[selectedWatchlistIndex].user_id = userId;

      axios
        .put(
          `${BASE_URL}/watchlist/addContractsScreeners`,
          updatedWatchLists[selectedWatchlistIndex],
          {
            headers: {
              'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
            },
          },
        )
        .then((response) => {
          console.log('Updated watchlist stored successfully:', response.data);
          // Update the state with the modified watchlist after the API request is successful
          setWatchLists(updatedWatchLists);
        })
        .catch((error) => {
          console.error('Error storing updated watchlist:', error);
        });
    } else {
      alert('No watchlist is selected. Please select one to update.');
    }
  };
  
  const removeSelectedFromWatchList = () => {
    if (!selectedWatchlist) {
      console.error('No watchlist selected');
      alert('No watchlist selected');
      return;
    }
    setWatchLists((prevWatchLists) => {
      const updatedWatchLists = prevWatchLists.map((watchlist) => {
        if (watchlist.name === selectedWatchlist) {
          // Remove selectedSubProducts from the items array
          const updatedItems = watchlist.items.filter(
            (item) => !selectedSubProducts.includes(item),
          );
          return { ...watchlist, items: updatedItems };
        }
        return watchlist;
      });
      return updatedWatchLists;
    });
  };

  const addWatchlistBlock = () => {
    setShowNewWatchlistInput(true); // Show the input for entering watchlist name
    setShowAddBtn(false); // Hide the "+" button
  };

  const toggleNewWatchlistInput = () => {
    setShowNewWatchlistInput((prev) => !prev);
  };

  const handleNewWatchlistNameChange = (e) => {
    setNewWatchlistName(e.target.value);
  };

  const addNewWatchlist = () => {
    if (instance.getActiveAccount()) {
      // if user is logged in, then only allow him to create a watchList o/w don't allow
      if (newWatchlistName.trim() === '') {
        alert('Please enter a name for the new watchlist');
        return;
      }

      const newWatchlist = {
        user_id: accounts[0].homeAccountId.split('.')[0], // Extracting unique ID from the azure auth, which will be sent to the backend and stored in the db, and will be used as foreign key in the database
        name: newWatchlistName.trim(),
        contracts: {}, // Initialize with empty contracts objects
        screeners: [], // Initialize with empty selected screeners array
      };

      console.log(
        'New watchlist with name',
        newWatchlist.name,
        'created.',
        newWatchlist,
      );

      axios
        .post(`${BASE_URL}/watchlist/create`, newWatchlist, {
          headers: {
            'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
          },
        })
        .then((response) => {
          console.log('New watchlist stored successfully:', response.data);
        })
        .catch((error) => {
          console.error('Error storing new watchlist:', error);
        });

      // Update watchlists state
      setWatchLists([...watchLists, newWatchlist]);

      // Reset input fields
      setNewWatchlistName('');
      setShowNewWatchlistInput(false);
      setShowAddBtn(true);
    } else {
      alert(
        'You are not logged in, Please login using your hertshtengroup mail ID to create a watchlist.',
      );
    }
  };

  const handleWatchlistChange = (e) => {
    const selectedWatchlistName = e.target.value;
    setSelectedWatchlistName(selectedWatchlistName);
    // Set selectedSubProducts and subProductDetails based on the currently selected watchlist
    const selectedWatchlist = watchLists.find(
      (watchlist) => watchlist.name === selectedWatchlistName,
    );
    setSelectedWatchlist(selectedWatchlist);
    const updatedSubProducts =
      selectedWatchlist && selectedWatchlist.items
        ? selectedWatchlist.items.reduce(
            (acc, curr) => acc.concat(curr.contracts),
            [],
          )
        : [];
    setSubProductDetails((prevDetails) => {
      const updatedDetails = prevDetails.map((detail) => ({
        ...detail,
        isSelected: updatedSubProducts.includes(detail.subProduct),
      }));
      return updatedDetails;
    });
    setSelectedSubProducts(updatedSubProducts);
  };

  const deleteWatchList = (e) => {
    if (!selectedWatchlist) {
      // console.error("No watchlist selected");
      alert('No watchlist selected');
      return;
    }

    const user_id = userId;
    const watchlist_name = selectedWatchlist.name;

    // Making the DELETE request to the backend API
    axios
      .delete(`${BASE_URL}/watchlist/delete/${user_id}/${watchlist_name}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
        },
      })
      .then((response) => {
        console.log('Watchlist deleted successfully:', response.data);

        // Remove the deleted watchlist from the local state
        const updatedWatchLists = watchLists.filter(
          (watchlist) => watchlist.name !== selectedWatchlist.name,
        );
        setWatchLists(updatedWatchLists);
        setSelectedWatchlist([]);
        setSelectedWatchlistName(null);
        setSelectedSubProducts([]);
      })
      .catch((error) => {
        console.error('Error deleting watchlist:', error);
      });
  };

  useEffect(() => {
    // let
    // console.log('the subproudct details is : ',subProductDetails)
    // subProductDetails.forEach((currSubProduct)=>{
    //   console.log('Current Subproduct is : ',currSubProduct);
    // });
  }, [subProductDetails]);

  /********************************Watchlist functionality ends ************************************************** */
  const styles = {
    dropdown: {
      width: '10vw'
    },
    watchListdropdown: {
      width: '8vw',
    },
    createWatchListInput: {
      maxWidth: '9vw',
    },
   
    searchInput: {
      marginBottom: 16,
    },
    tableContainer: {
      height: '100%',
      width: '100%',
    },
    checkbox: {
      padding: 0,
    },
    columnHeader: {
      fontWeight: 'bold',
    },
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
    setSelectedSubProducts([]);
  };

  const handleTimeFrameChange = (event) => {
    setSelectedTimeFrame(event.target.value);
  };

  const columns = [
    {
      field: 'select',
      headerName: 'Select',
      renderCell: (params) => (
        <Checkbox
          checked={selectedSubProducts.includes(params.row.subProduct)}
          onChange={() => handleSubProductCheckboxChange(params.row.subProduct)}
          style={styles.checkbox}
        />
      ),
      sortable: false,
      width: 70,
    },
    {
      field: 'subProduct',
      headerName: 'Contract',
      width: 100,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },

    {
      field: 'ltp',
      headerName: 'LTP',
      width: 75,
      sortable: true,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },
    {
      field: 'dcw',
      headerName: 'DCW',
      width: 75,
      sortable: true,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },
    {
      field: 'atr',
      headerName: 'ATR',

      width: 75,
      sortable: true,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },
    {
      field: 'ratio',
      headerName: 'Ratio',
      description: 'This column has a value getter and is not sortable.',
      sortable: true,
      width: 75,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },
    {
      field: 'zscore',
      headerName: 'ZScore',
      width: 80,
      sortable: true,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },
    {
      field: 'vol',
      headerName: 'Volume',
      width: 130,
      sortable: true,
      headerClassName: 'super-app-theme--header',
      headerAlign: 'left',
    },
  ];

  return (
    <Box
      p={2}
      sx={{
        height: '50vh',
        width: '37vw',
        display: 'flex',

        flexDirection: 'column',
      }}
    >
      <Grid container spacing={0} sx={{ flexGrow: 1 }}>
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="center">
            <Box
              style={{
                width: '100%',
                marginTop: '15px',
                marginBottom: '-50px',
                marginLeft: '18px',
                borderRadius: '3px',
              }}
            >
              <Stack direction="row" spacing={2}>
                {/* <Grid container>
                  <Grid item xs={4} display="flex" justifyContent="flex-start"> */}
                    <FormControl style={styles.dropdown} size="small">
                      <InputLabel id="product-select-label" color="primary">
                        Product
                      </InputLabel>
                      <Select
                        id="product-select"
                        label="product-select-label"
                        value={selectedProduct}
                        onChange={handleProductChange}
                        variant="outlined"
                        size="small"
                        renderValue={(selected) => (
                          <Box style={styles.dropdownItem}>{selected}</Box>
                        )}
                      >
                        {productList.map((product, index) => (
                          <MenuItem key={index} value={product.label}>
                            {product.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  {/* </Grid> */}

                  {/* <Grid item xs={4} display="flex" justifyContent="center"> */}
                    <FormControl style={styles.dropdown} size="small">
                      <InputLabel id="timeframe-label">Timeframe</InputLabel>
                      <Select
                        id="timeframe-select"
                        label="timeframe-label"
                        value={selectedTimeFrame}
                        variant="outlined"
                        size="small"
                        onChange={handleTimeFrameChange}
                      >
                        {timeFrameOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                            style={styles.dropdownItem}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  {/* </Grid> */}

                  {/* <Grid item xs={4} display="flex" justifyContent="flex-end"> */}
                    <TextField
                      placeholder="Search Contracts"
                      variant="outlined"
                      size="small"
                      value={searchText}
                      onChange={handleSearchTextChange}
                      style={styles.searchInput}
                    />
                  {/* </Grid> */}
                {/* </Grid> */}
              </Stack>
            </Box>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Box
            style={{
              height: '36vh',
              width: '100%',
              overflow: 'auto',
              marginBottom: '-35px',
              borderRadius: '6px',
            }}
          >
            {(selectedProduct || subProductDetails.length > 0) && (
              <DataGrid
                rows={subProductDetails}
                getRowId={(row) => row.id}
                columns={columns}
                // checkboxSelection
                initialState={{
                  sorting: {
                    sortModel: [{ field: 'ltp', sort: 'desc' }],
                  },
                }}
                hideFooter
              />
            )}
          </Box>
        </Grid>

        {userId ? (
          <Grid item xs={12}>
            <Box>
              <Stack direction="row" spacing={1}>
                <Grid container>
                  <Grid item xs={7} display="flex" justifyContent="flex-start">
                    <FormControl style={styles.watchListdropdown} size="small">
                      <InputLabel
                        id="watchlist-label-id"
                        InputProps={{
                          sx: {
                            padding: '0px',
                            '& .MuiInputBase-input': {
                              padding: '0px',
                            },
                          },
                        }}
                      >
                        Select Watchlist
                      </InputLabel>
                      <Select
                        id="demo-simple-select"
                        label="watchlist-label"
                        labelId="watchlist-label-id"
                        value={selectedWatchlistName}
                        size="small"
                        placeholder="Select WatchList"
                        onChange={handleWatchlistChange}
                      >
                        {watchLists.map((watchlist) => (
                          <MenuItem
                            key={watchlist.name}
                            value={watchlist.name}
                            style={styles.dropdownItem}
                          >
                            {watchlist.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {showAddBtn && (
                      <Grid item>
                        <Button
                          onClick={addWatchlistBlock}
                          variant="contained"
                          sx={{ ml: 1 }}
                        >
                          Create Watchlist
                        </Button>
                      </Grid>
                    )}
                    {showNewWatchlistInput && (
                      <Grid item>
                        <TextField
                          value={newWatchlistName}
                          variant="outlined"
                          size="small"
                          sx={{ ml: 1 }}
                          onChange={handleNewWatchlistNameChange}
                          placeholder="Enter watchlist name"
                          style={styles.createWatchListInput}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addNewWatchlist();
                            }
                          }}
                        />

                        <Button
                          variant="contained"
                          size="small"
                          sx={{ ml: 1 }}
                          onClick={addNewWatchlist}
                        >
                          Create
                        </Button>
                      </Grid>
                    )}
                    {errorMessage && (
                      <Grid item>
                        <Box style={{ color: 'red', marginBottom: '10px' }}>
                          {errorMessage}
                        </Box>
                        <Box style={{ color: 'red', marginBottom: '10px' }}>
                          {errorMessage}
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  {selectedWatchlist.length !== 0 ? (
                    <Grid item xs={5} display="flex" justifyContent="flex-end">
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          ml: 1,
                        }}
                        onClick={updateWatchList}
                      >
                        Update WatchList
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={deleteWatchList}
                      >
                        Delete WatchList
                      </Button>
                    </Grid>
                  ) : (
                    <></>
                  )}
                </Grid>
              </Stack>
            </Box>
          </Grid>
        ) : (
          // <Paper
          //   style={{
          //     borderRadius: '6px',
          //     height: '5vh',
          //     width: '100%',
          //     margin: '0 auto',
          //   }}
          // >
          //   <Grid item xs={12}>
          //     <h4>Login To Create Watchlist</h4>
          //   </Grid>
          // </Paper>
          <Paper
            style={{
              borderRadius: '6px',
              height: '4vh',
              width: '100%',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Grid
              item
              xs={12}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="h6" color="error">
                Login To Create Watchlist
              </Typography>
            </Grid>
          </Paper>
        )}
      </Grid>

      <Grid item xs={12}>
        <ScreenerList
          product={selectedProduct}
          subProduct={selectedSubProducts}
          selectedTimeFrame={selectedTimeFrame}
          watchLists={watchLists}
          setWatchLists={setWatchLists}
          selectedWatchlist={selectedWatchlist}
          setSelectedWatchlist={setSelectedWatchlist}
          screeners={screeners}
          setScreeners={setScreeners}
          selectedScreeners={selectedScreeners}
          setSelectedScreeners={setSelectedScreeners}
          handleScreenerSelect={handleScreenerSelect}
          lookBackPeriod={lookBackPeriod}
          setLookBackPeriod={setLookBackPeriod}
          showCustomScreener={showCustomScreener}
          setShowCustomScreener={setShowCustomScreener}
          customScreeners={customScreeners}
          setCustomScreeners={setCustomScreeners}
          userId={userId}
        />
      </Grid>
    </Box>
  );
};

export default ProductList;
