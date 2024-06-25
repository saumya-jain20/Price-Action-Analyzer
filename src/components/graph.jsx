import * as am5 from '@amcharts/amcharts5';
import * as am5stock from '@amcharts/amcharts5/stock';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5xy from '@amcharts/amcharts5/xy';
import { useMsal } from '@azure/msal-react';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import { CircularProgress } from '@mui/material';
import { Stack } from '@mui/material';
import { green } from '@mui/material/colors';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import DownloadingIcon from '@mui/icons-material/Downloading';

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CorrelationPopup from './correlationPopup';

let BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Graph = ({
  product, // the selected product
  subProduct, // this stores the contracts of the selected product
  selectedContract, // the selected contract from the selectedScreeners component
  screeners, // these are all the screeners that user selected
  screener, // this is the selected screener from the selectedScreeners component
  setSelectedScreener, // this is the function to update the selected screener
  screenerResults, // to apply screenrs on to the graph
  setScreenerResults, // to update the screenerResults
  selectedTimeFrame, // selected timeFrame
  watchLists, // all watchLists of the current user
  selectedWatchlist, // the current selected watchList
  selectedContractNames // containes the names of all selected watchlist
}) => {
  // console.log(selectedContract)
  // for amcharts
  const rootRef = useRef(null);
  const valueAxisRef = useRef(null);
  const dateAxisRef = useRef(null);
  const stockChartRef = useRef(null);
  const valueSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const sbSeriesRef = useRef(null);
  const mainPanelRef = useRef(null);

  // state for updating the ohlc and patterns data
  const [historicalData, setHistoricalData] = useState([]);
  const [patternsData, setPatternsData] = useState([]);

  // state for updating the display
  const [displayMode, setDisplayMode] = useState('patternChart');

  // state for updating the correaltion heatmap
  const [showCorrelationPopup, setShowCorrelationPopup] = useState(false);

  // state for storing the correlationData to avoid calling api again
  const [correlationData, setCorrelationData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [riskLinesPatternsData, setRiskLinesPatternsData] = useState([]);
  const [hasFetchedRiskLinesData, setHasFetchedRiskLinesData] = useState(false);

  // for the azure authentication with only hertshtengroup
  const { accounts } = useMsal(); // to access the details of the current logged in user

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (selectedWatchlist.length === 0 && selectedContract !== null) {
          // If no watchlist is selected, fetch data based on seletcedContract directly
          const histResponse = await fetch(
            `${BASE_URL}/historicalData/${
              product || ''
            }/${selectedContract}?time_frame=${selectedTimeFrame}`,
            {
              headers: {
                'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
              },
            },
          );
          const histData = await histResponse.json();
          console.log(histData);
          setHistoricalData(histData);
          setPatternsData([]);
        } else {
          // If a watchlist is selected, find the corresponding product and fetch data based on it
          const selectedWatchlistData = watchLists.find(
            (list) => list.name === selectedWatchlist.name,
          );
          if (selectedWatchlistData) {
            const watchlistProducts = Object.keys(
              selectedWatchlistData.contracts,
            );
            const productFromWatchlist = watchlistProducts.find((product) =>
              selectedContract.startsWith(product),
            );
            if (productFromWatchlist) {
              const histResponse = await fetch(
                `${BASE_URL}/historicalData/${
                  productFromWatchlist || ''
                }/${selectedContract}?time_frame=${selectedTimeFrame}`,
                {
                  headers: {
                    'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
                  },
                },
              );
              const histData = await histResponse.json();
              console.log(histData);
              setHistoricalData(histData);
              setPatternsData([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    setPatternsData([]);
    fetchData();
  }, [selectedContract, selectedWatchlist]);

  useEffect(() => {
    if (!historicalData.length) return;
    if (selectedWatchlist.length !== 0) {
      // when watchlist is selected
      const fetchData = async () => {
        const subProductSelected = selectedContract;
        if (!screener) {
          setPatternsData([]);
        } else {
          try {
            if (screenerResults) {
              for (let i = 0; i < screenerResults.length; i++) {
                for (let contract in screenerResults[i]) {
                  if (contract === subProductSelected) {
                    for (let currentScreener in screenerResults[i][contract]) {
                      if (screener === currentScreener) {
                        setPatternsData(
                          screenerResults[i][subProductSelected][
                            currentScreener
                          ],
                        );
                        console.log(
                          screenerResults[i][subProductSelected][
                            currentScreener
                          ],
                        );
                      }
                    }
                  }
                }
              }
            } else {
              console.error('Error: Data not found for the selected screener');
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        }
      };
      fetchData();
    } else {
      // when no watchlist is selected
      const fetchData = async () => {
        const subProductSelected = selectedContract;
        if (!screener) {
          setPatternsData([]);
        } else {
          try {
            if (
              screenerResults &&
              screenerResults[subProductSelected] &&
              screenerResults[subProductSelected][screener]
            ) {
              const patternsDataForScreener =
                screenerResults[subProductSelected][screener];
              setPatternsData(patternsDataForScreener);
              console.log(
                'patterns data for',
                screener,
                patternsDataForScreener,
              );
            } else {
              console.error('Error: Data not found for the selected screener');
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        }
      };
      fetchData();
    }
  }, [screener]);

  const calculateBaseInterval = () => {
    switch (selectedTimeFrame) {
      case '15min':
        return { timeUnit: 'minute', count: 15 };
      case '30min':
        return { timeUnit: 'minute', count: 30 };
      case '45min':
        return { timeUnit: 'minute', count: 45 };
      case '1hr':
        return { timeUnit: 'hour', count: 1 };
      case '2hr':
        return { timeUnit: 'hour', count: 2 };
      case '4hr':
        return { timeUnit: 'hour', count: 4 };
      default:
        return { timeUnit: 'minute', count: 15 };
    }
  };

  const memoizedHistoricalData = useMemo(
    () => historicalData.reverse(),
    [historicalData],
  );
  const memoizedPatternsData = useMemo(() => patternsData, [patternsData]);

  useLayoutEffect(() => {
    var root = am5.Root.new('chart-div');
    root.setThemes([am5themes_Animated.new(root)]);
    if (historicalData && historicalData.length > 0)
      historicalData.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    var stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {
        wheelX: 'panX',
        wheelY: 'zoomX',
        panX: true,
        panY: true,
        seriesContainer: am5.Container.new(root, {
          layout: am5.Layout.fixedGrid,
          width: am5.percent(100),
          height: am5.percent(100),
          panKey: 'shift',
        }),
      }),
    );
    root.numberFormatter.set('numberFormat', '#,###.00');
    var mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: 'zoomX',
        panX: true,
        panY: true,
      }),
    );
    var valueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: 'zoom',
        }),
        extraMin: 0.1,
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: '#,###.00',
        extraTooltipPrecision: 2,
      }),
    );
    var dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: calculateBaseInterval(),
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
        skipEmptyPeriods: true,
      }),
    );
    var valueSeries = mainPanel.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: selectedContract,
        // name: "",
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Close',
        highValueYField: 'High',
        lowValueYField: 'Low',
        openValueYField: 'Open',
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText:
          'Open: [bold]{openValueY}[/] High: [bold]{highValueY}[/] Low: [bold]{lowValueY}[/] Close: [bold]{valueY}[/]',
        legendRangeValueText: '',
      }),
    );
    stockChart.set('stockSeries', valueSeries);
    var valueLegend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, {
        stockChart: stockChart,
      }),
    );
    var volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      inside: true,
    });
    volumeAxisRenderer.labels.template.set('forceHidden', true);
    volumeAxisRenderer.grid.template.set('forceHidden', true);
    var volumeValueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        numberFormat: '#.#a',
        height: am5.percent(20),
        y: am5.percent(100),
        centerY: am5.percent(100),
        renderer: volumeAxisRenderer,
      }),
    );
    var volumeSeries = mainPanel.series.push(
      am5xy.ColumnSeries.new(root, {
        name: 'Volume',
        clustered: false,
        valueXField: 'Date',
        valueYField: 'Volume',
        xAxis: dateAxis,
        yAxis: volumeValueAxis,
        legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]",
      }),
    );
    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.5,
    });
    volumeSeries.columns.template.adapters.add('fill', function (fill, target) {
      var dataItem = target.dataItem;
      if (dataItem) {
        return stockChart.getVolumeColor(dataItem);
      }
      return fill;
    });
    stockChart.set('volumeSeries', volumeSeries);
    valueLegend.data.setAll([valueSeries, volumeSeries]);
    mainPanel.set(
      'cursor',
      am5xy.XYCursor.new(root, {
        yAxis: valueAxis,
        xAxis: dateAxis,
        limitY: true,
        rangeZoom: true,
      }),
    );
    var scrollbar = mainPanel.set(
      'scrollbarX',
      am5xy.XYChartScrollbar.new(root, {
        orientation: 'horizontal',
        height: 50,
        behavior: 'none',
      }),
    );
    stockChart.toolsContainer.children.push(scrollbar);
    var sbDateAxis = scrollbar.chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: calculateBaseInterval(),
        renderer: am5xy.AxisRendererX.new(root, {}),
      }),
    );
    var sbValueAxis = scrollbar.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: 'zoom',
        }),
      }),
    );
    var sbSeries = scrollbar.chart.series.push(
      am5xy.LineSeries.new(root, {
        valueYField: 'Close',
        valueXField: 'Date',
        xAxis: sbDateAxis,
        yAxis: sbValueAxis,
      }),
    );
    sbSeries.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3,
    });
    sbSeries.appear(500);
    var seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
      stockChart: stockChart,
    });
    seriesSwitcher.events.on('selected', function (ev) {
      setSeriesType(ev.item.id);
    });
    function getNewSettings(series) {
      var newSettings = [];
      am5.array.each(
        [
          'name',
          'valueYField',
          'highValueYField',
          'lowValueYField',
          'openValueYField',
          'calculateAggregates',
          'valueXField',
          'xAxis',
          'yAxis',
          'legendValueText',
          'stroke',
          'fill',
        ],
        function (setting) {
          newSettings[setting] = series.get(setting);
        },
      );
      return newSettings;
    }
    function setSeriesType(seriesType) {
      var currentSeries = stockChart.get('stockSeries');
      var newSettings = getNewSettings(currentSeries);
      var data = currentSeries.data.values;
      mainPanel.series.removeValue(currentSeries);
      var series;
      switch (seriesType) {
        case 'line':
          series = mainPanel.series.push(
            am5xy.LineSeries.new(root, newSettings),
          );
          break;
        case 'candlestick':
        case 'procandlestick':
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.CandlestickSeries.new(root, newSettings),
          );
          if (seriesType === 'procandlestick') {
            series.columns.template.get('themeTags').push('pro');
          }
          break;
        case 'ohlc':
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.OHLCSeries.new(root, newSettings),
          );
          break;
        default: // Added by Rishabh
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.OHLCSeries.new(root, newSettings),
          );
      }
      if (series) {
        valueLegend.data.removeValue(currentSeries);
        series.data.setAll(data);
        stockChart.set('stockSeries', series);
        var cursor = mainPanel.get('cursor');
        if (cursor) {
          cursor.set('snapToSeries', [series]);
        }
        valueLegend.data.insertIndex(0, series);
      }
    }
    var toolbar = am5stock.StockToolbar.new(root, {
      container: document.getElementById('chartcontrols'),
      stockChart: stockChart,
      controls: [
        am5stock.IndicatorControl.new(root, {
          stockChart: stockChart,
          legend: valueLegend,
        }),
        seriesSwitcher,
        am5stock.DrawingControl.new(root, {
          stockChart: stockChart,
        }),
        am5stock.ResetControl.new(root, {
          stockChart: stockChart,
        }),
        am5stock.SettingsControl.new(root, {
          stockChart: stockChart,
        }),
      ],
    });
    rootRef.current = root;
    dateAxisRef.current = dateAxis;
    valueAxisRef.current = valueAxis;
    stockChartRef.current = stockChart;
    valueSeriesRef.current = valueSeries;
    volumeSeriesRef.current = volumeSeries;
    sbSeriesRef.current = sbSeries;
    mainPanelRef.current = mainPanel;
    return () => {
      root.dispose();
    };
  }, [selectedContract]);

  const handleCorrelationClose = () => {
    setShowCorrelationPopup(false);
    setDisplayMode('patternChart');
  };

  useLayoutEffect(() => {
    while (mainPanelRef.current.series.length > 2) {
      const n = mainPanelRef.current.series.length - 1;
      mainPanelRef.current.series.removeIndex(n);
    }

    if (!historicalData.length) return;

    if (
      displayMode === 'patternChart' &&
      screener &&
      patternsData &&
      patternsData.length > 0
    ) {
      if (screener === 'smc') {
        let UpdatedPatternsData = [];
        let ListLength = patternsData.length;
        for (let i = 0; i + 1 < ListLength; i += 2) {
          UpdatedPatternsData.push([patternsData[i], patternsData[i + 1]]);
        }

        UpdatedPatternsData.forEach((pattern, index) => {
          let valuelineSeries = mainPanelRef.current.series.push(
            am5xy.LineSeries.new(rootRef.current, {
              name: `Line Series ${index + 1}`,
              clustered: false,
              valueXField: 'Date',
              valueYField: 'Close',
              xAxis: dateAxisRef.current,
              yAxis: valueAxisRef.current,
              connect: true,
              calculateAggregates: true,
              legendValueText: 'close: {valueY}',
              legendRangeValueText: '',
              strokeWidth: 5,
              stroke: '#0000ff',
            }),
          );
          valuelineSeries.data.setAll(pattern);
        });
      } else if (screener === 'fp') {
        patternsData.forEach((patterns, patternIndex) => {
          patterns.forEach((pattern, index) => {
            let flaglineSeries = mainPanelRef.current.series.push(
              am5xy.LineSeries.new(rootRef.current, {
                name: `Flag Pattern ${patternIndex + 1} - Line ${index + 1}`,
                clustered: false,
                valueXField: 'Date',
                valueYField: 'Close',
                xAxis: dateAxisRef.current,
                yAxis: valueAxisRef.current,
                connect: true,
                calculateAggregates: true,
                legendValueText: 'close: {valueY}',
                legendRangeValueText: '',
                strokeWidth: 5,
                stroke: '#0000ff',
              }),
            );
            flaglineSeries.data.setAll(pattern);
          });
        });
      } else {
        patternsData.forEach((pattern, index) => {
          let valuelineSeries = mainPanelRef.current.series.push(
            am5xy.LineSeries.new(rootRef.current, {
              name: `Line Series ${index + 1}`,
              clustered: false,
              valueXField: 'Date',
              valueYField: 'Close',
              xAxis: dateAxisRef.current,
              yAxis: valueAxisRef.current,
              connect: true,
              calculateAggregates: true,
              legendValueText: 'close: {valueY}',
              legendRangeValueText: '',
              strokeWidth: 5,
              stroke: '#0000ff',
            }),
          );
          valuelineSeries.data.setAll(pattern);
        });
      }
    } else if (displayMode === 'riskLines') {
      setSelectedScreener(null);

      let currentPlotData = [];
      for (let contr in riskLinesPatternsData) {
        if (contr === selectedContract) {
          currentPlotData = riskLinesPatternsData[contr].smc;
          break;
        }
      }

      let newUpdatedPatternsData = [];
      let ListLength = currentPlotData.length;
      for (let i = 0; i + 1 < ListLength; i += 2) {
        newUpdatedPatternsData.push([
          currentPlotData[i],
          currentPlotData[i + 1],
        ]);
      }

      newUpdatedPatternsData.forEach((pattern, index) => {
        let valuelineSeries = mainPanelRef.current.series.push(
          am5xy.LineSeries.new(rootRef.current, {
            name: `Line Series ${index + 1}`,
            clustered: false,
            valueXField: 'Date',
            valueYField: 'Close',
            xAxis: dateAxisRef.current,
            yAxis: valueAxisRef.current,
            connect: true,
            calculateAggregates: true,
            legendValueText: 'close: {valueY}',
            legendRangeValueText: '',
            strokeWidth: 5,
            stroke: '#0000ff',
          }),
        );
        valuelineSeries.data.setAll(pattern);
      });

      // console.log("Updated Patterns Data is ", currentPlotData);
    }

    stockChartRef.current.data = historicalData;
    valueSeriesRef.current.data.setAll(historicalData);
    volumeSeriesRef.current.data.setAll(historicalData);
    sbSeriesRef.current.data.setAll(historicalData);
    stockChartRef.current.appear(500);
  }, [
    screener,
    memoizedHistoricalData,
    memoizedPatternsData,
    displayMode,
    riskLinesPatternsData,
  ]);

  useEffect(() => {
    if (selectedWatchlist.length !== 0) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const userData = accounts[0];
          let user_Id = userData.homeAccountId.split('.')[0];
          const watchListName = selectedWatchlist.name;
          const response = await fetch(
            `${BASE_URL}/screenerlist/get_correlation/${user_Id}/${watchListName}`,
            {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
            },
          );
          if (response.ok) {
            const correlationData = await response.json();
            // console.log("correlationData", correlationData);
            setCorrelationData(correlationData);
          } else {
            console.error('Failed to fetch correlation data');
          }
        } catch (error) {
          console.error('Error fetching correlation data:', error);
        }
        finally{
          setLoading(false);
        }
      };
      fetchData();
    }
    // this dependency to keep a check of updation of watchlists
  }, [selectedWatchlist, watchLists]);

  useEffect(() => {
    if (!selectedWatchlist || selectedWatchlist.length === 0) {
      if (product !== null && subProduct.length !== 0) {
        const fetchData = async () => {
          setLoading(true);
          const contractsQueryString = subProduct
            .map((contract) => `contracts=${contract}`)
            .join('&');
          try {
            const response = await fetch(
              `${BASE_URL}/screenerlist/get_no_watchlist_correlation?product=${product}&${contractsQueryString}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'ngrok-skip-browser-warning': 'true',
                },
              },
            );
            if (response.ok) {
              const correlationData = await response.json();
              setCorrelationData(correlationData);
            } else {
              console.error('Failed to fetch correlation data');
            }
          } catch (error) {
            console.error('Error fetching correlation data:', error);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
      }
    }
  }, [subProduct]);

  const handleDisplayModeChange = async (mode) => {
    // Clear existing series before switching modes
    while (mainPanelRef.current.series.length > 2) {
      const n = mainPanelRef.current.series.length - 1;
      mainPanelRef.current.series.removeIndex(n);
    }

    if (mode === 'correlation') {
      setDisplayMode(mode);
      setShowCorrelationPopup(true);
    } else if (mode === 'riskLines') {
      setShowCorrelationPopup(false);

      // Toggle risk lines
      if (displayMode === 'riskLines') {
        // If already in riskLines mode, remove the risk lines and switch to another mode
        setDisplayMode('patternChart');
      } else {
        setDisplayMode('riskLines');

        if (selectedWatchlist.length === 0) {
          // When no watchlist is selected
          // console.log(riskLinesPatternsData);
          let temp_data = { ...riskLinesPatternsData };
          let needsFetch = false;

          // Check if data for all selected contracts is already available
          for (const contract of subProduct) {
            if (!temp_data[contract] || !temp_data[contract].smc) {
              needsFetch = true;
              setHasFetchedRiskLinesData(false);
              break; // gets one true, exit the loop
            }
          }



          if (needsFetch) {
            let combined_data = [];

            for (const contract of subProduct) {
              if (!temp_data[contract] || !temp_data[contract].smc) {
                const apiURL = `${BASE_URL}/screenerlist/apply_screeners?product=${product}&contracts=${contract}&screeners=smc&time_frame=${selectedTimeFrame}`;

                try {
                  const response = await fetch(apiURL, {
                    headers: {
                      'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
                    },
                  });

                  if (!response.ok) {
                    throw new Error('Failed to fetch data from the backend');
                  }

                  const data = await response.json();
                  combined_data.push({ [contract]: data[contract] });
                } catch (error) {
                  console.error('Error fetching risk lines data:', error);
                }
              }
            }

            combined_data.forEach((contractData) => {
              for (const key in contractData) {
                if (contractData.hasOwnProperty(key)) {
                  if (!temp_data[key]) {
                    temp_data[key] = { smc: [] };
                  }
                  const smcArray = contractData[key].smc;

                  const converted_data = smcArray.map((entry) => ({
                    swing: entry.swing,
                    start_date: entry.start_date
                      ? Date.parse(entry.start_date)
                      : null,
                    end_date: entry.end_date
                      ? Date.parse(entry.end_date)
                      : null,
                  }));

                  let sma_data_list = [];
                  converted_data.forEach((object) => {
                    if (
                      object.start_date !== null &&
                      object.end_date !== null
                    ) {
                      sma_data_list.push({
                        Close: object.swing,
                        Date: object.start_date,
                      });
                      sma_data_list.push({
                        Close: object.swing,
                        Date: object.end_date,
                      });
                    }
                  });

                  temp_data[key].smc = temp_data[key].smc.concat(sma_data_list);
                }
              }
            });

            setRiskLinesPatternsData(temp_data);
            setHasFetchedRiskLinesData(true); // Set the flag to true
          }
        } else {
          // When watchlist is selected
          // When no watchlist is selected
          // console.log(riskLinesPatternsData);
          const { contracts } = selectedWatchlist; // destructuring selected watchlist
          console.log('The subProduct in the current watchlist are : ',subProduct);

          let temp_data = { ...riskLinesPatternsData };
          let needsFetch = false;

          // Check if data for all selected contracts is already available
          for (const contract of selectedContractNames) {
            if (!temp_data[contract] || !temp_data[contract].smc) {
              needsFetch = true;
              setHasFetchedRiskLinesData(false);
              break; // gets one true, exit the loop
            }
          }

          if (needsFetch) {
            let combined_data = [];
            setHasFetchedRiskLinesData(false);

            for (const contract in contracts) {
              let len = contracts[contract].length;

              for (let i = 0; i < len; i++) {
                const subContract = contracts[contract][i];

                const apiURL = `${BASE_URL}/screenerlist/apply_screeners?product=${contract}&contracts=${subContract}&screeners=smc&time_frame=${selectedTimeFrame}`;

                try {
                  const response = await fetch(apiURL, {
                    headers: {
                      'ngrok-skip-browser-warning': 'true', // Set and send ngrok-skip-browser-warning header
                    },
                  });

                  if (!response.ok) {
                    throw new Error('Failed to fetch data from the backend');
                  }

                  const data = await response.json();
                  // console.log("Risk Lines data", data);

                  combined_data.push(data);
                } catch (error) {
                  console.error('Error fetching risk lines data:', error);
                }
              }
            }

            console.log('Risk Lines data:', combined_data);

            // Process combined data for each contract
            combined_data.forEach((contractData) => {
              for (const key in contractData) {
                if (contractData.hasOwnProperty(key)) {
                  if (!temp_data[key]) {
                    temp_data[key] = { smc: [] };
                  }
                  const smcArray = contractData[key].smc;

                  const converted_data = smcArray.map((entry) => ({
                    swing: entry.swing,
                    start_date: entry.start_date
                      ? Date.parse(entry.start_date)
                      : null,
                    end_date: entry.end_date
                      ? Date.parse(entry.end_date)
                      : null,
                  }));

                  let sma_data_list = [];
                  converted_data.forEach((object) => {
                    if (
                      object.start_date !== null &&
                      object.end_date !== null
                    ) {
                      sma_data_list.push({
                        Close: object.swing,
                        Date: object.start_date,
                      });
                      sma_data_list.push({
                        Close: object.swing,
                        Date: object.end_date,
                      });
                    }
                  });

                  temp_data[key].smc = temp_data[key].smc.concat(sma_data_list);
                }
              }
            });

            // console.log(temp_data);

            setRiskLinesPatternsData(temp_data);
            setHasFetchedRiskLinesData(true); // Set the flag to true
          }
        }
      }
    } else {
      setDisplayMode(mode);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '41vh',
        right: '0.01vw',
        // top: '0.1vh',
        left: '0.1vw',
        pt: 1, // Padding, adjust as needed
        px: 1,
        bgcolor: 'background.paper', // Background color, optional
        boxShadow: 1, // Box shadow, optional
      }}
    >
      <Box id="chartcontrols" style={{}}></Box>

      <Box
        id="chart-div"
        style={{
          width: '60.5vw',
          height: '41vh',
          maxWidth: '80vw',
        }}
       
      ></Box>
      <Stack
      
        display={'flex'}
        justifyContent={'space-between'}
        direction={'row'}
        sx={{pb: '2vh'}}
      >
        <Button
          sx={{
            color: displayMode === 'chartOnly' ? '#000000' : '#FFFFFF', // Change text color based on selection
            backgroundColor:
              displayMode === 'chartOnly' ? '#ff6347' : '#2d53b5', // Change background color based on selection
            '&:hover': {
              backgroundColor:
                displayMode === 'chartOnly' ? '#e55347' : '#032d87', // Different hover color if selected
            },
          }}
          onClick={() => handleDisplayModeChange('chartOnly')}
        >
          Chart Only
        </Button>
        <Button
          sx={{
            color: displayMode === 'patternChart' ? '#000000' : '#FFFFFF', // Change text color based on selection
            backgroundColor:
              displayMode === 'patternChart' ? '#ff6347' : '#2d53b5', // Change background color based on selection
            '&:hover': {
              backgroundColor:
                displayMode === 'patternChart' ? '#e55347' : '#032d87', // Different hover color if selected
            },
          }}
          onClick={() => handleDisplayModeChange('patternChart')}
        >
          Pattern Chart
        </Button>
        <Button
          sx={{
            color: displayMode === 'riskLines' ? '#000000' : '#FFFFFF', // Change text color based on selection
            backgroundColor:
              displayMode === 'riskLines' ? '#ff6347' : '#2d53b5', // Change background color based on selection
            '&:hover': {
              backgroundColor:
                displayMode === 'riskLines' ? '#e55347' : '#032d87', // Different hover color if selected
            },
          }}
          onClick={() => handleDisplayModeChange('riskLines')}
        >
          Risk Lines
          {!hasFetchedRiskLinesData && displayMode === 'riskLines' && (
            <CircularProgress
              size={30}
              sx={{
                color: green[500],
                position: 'absolute',
                left: 110,
                zIndex: 1,
              }}
            />
          )}
        </Button>
        <Button
          sx={{
            color: displayMode === 'heatMap' ? '#000000' : '#FFFFFF', // Change text color based on selection
            backgroundColor: displayMode === 'heatMap' ? '#ff6347' : '#2d53b5', // Change background color based on selection
            '&:hover': {
              backgroundColor:
                displayMode === 'heatMap' ? '#e55347' : '#032d87', // Different hover color if selected
            },
          }}
          onClick={() => handleDisplayModeChange('heatMap')}
        >
          Risk Heatmap
        </Button>
        <Button
          sx={{
            color: displayMode === 'correlation' ? '#000000' : '#FFFFFF', // Change text color based on selection
            backgroundColor:
              displayMode === 'correlation' ? '#ff6347' : '#2d53b5', // Change background color based on selection
            '&:hover': {
              backgroundColor:
                displayMode === 'correlation' ? '#e55347' : '#032d87', // Different hover color if selected
            },
          }}
          onClick={() => handleDisplayModeChange('correlation')}
        >
          Correlation
          {loading && (
            <CircularProgress
              size={30}
              sx={{
                color: green[500],
                position: 'absolute',
                left: 126,
                zIndex: 1,
              }}
            />
          )}
        </Button>

        <Button
          sx={{
            color: displayMode === 'tradePlanner' ? '#000000' : '#FFFFFF', // Change text color based on selection
            backgroundColor:
              displayMode === 'tradePlanner' ? '#ff6347' : '#2d53b5', // Change background color based on selection
            '&:hover': {
              backgroundColor:
                displayMode === 'tradePlanner' ? '#e55347' : '#032d87', // Different hover color if selected
            },
          }}
          onClick={() => handleDisplayModeChange('tradePlanner')}
        >
          Trade Planner
        </Button>
      </Stack>

      {showCorrelationPopup && correlationData && (
        // To ensure correlationData is available before rendering the CorrelationPopup
        //  <Box borderColor="primary.main"  display="flex" justifyContent="left" sx={{ width: '200%',height: '100%' }}>
        <CorrelationPopup
          correlationData={correlationData.correlation}
          closecorrelationData={correlationData.close_correlation}
          deltacorrelationData={correlationData.delta_correlation}
          contracts={correlationData.contracts}
          onClose={() => {setShowCorrelationPopup(false);
            setDisplayMode('patternChart')
          }}
        />
        // </Box>
      )}
    </Box>
  );
};

export default Graph;
