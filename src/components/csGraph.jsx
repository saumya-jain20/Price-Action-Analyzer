import React, { useRef, useEffect, useLayoutEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import * as am5stock from "@amcharts/amcharts5/stock";
import * as am5xy from "@amcharts/amcharts5/xy";

const CSGraph = ({ historicalData, finalResult, indicatorValues, interval, finalLag, type, selectedContract }) => {
  const rootRef = useRef(null);
  const valueAxisRef = useRef(null);
  const dateAxisRef = useRef(null);
  const stockChartRef = useRef(null);
  const valueSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const sbSeriesRef = useRef(null);
  const mainPanelRef = useRef(null);
  const secondaryPanelRef = useRef(null);
  const secondaryDateAxisRef = useRef(null);
  const secondaryValueAxisRef = useRef(null);
  const patternSeriesRef = useRef(null);
  const bullishPatternSeriesRef = useRef(null);
  const bearishPatternSeriesRef = useRef(null);

  let patternData = [];
  let bullishPatternData = [];
  let bearishPatternData = [];

  if(type==true) {
    historicalData.forEach((candle, index) => {
      const result = finalResult[index];
      if (result !== undefined) {
        if (result) {
          patternData.push(historicalData[index + finalLag]);
        }
      }
    });
    console.log(patternData);
  }
  else {
    historicalData.forEach((candle, index) => {
      const result = finalResult[index];
      const previousResult = index > 0 ? finalResult[index - 1] : undefined;
      if(result!==undefined) {
        if (result === true && previousResult === false) {
            bullishPatternData.push(historicalData[index + finalLag]);
        }
        if (result === false && previousResult === true) {
            bearishPatternData.push(historicalData[index + finalLag]);
        }
      }
    });
    console.log(bullishPatternData);
    console.log(bearishPatternData);
  }

  // historicalData.forEach((candle, index) => {
  //   const result = finalResult[index];
  //   const previousResult = index > 0 ? finalResult[index - 1] : undefined;
  //   if(result!==undefined) {
  //     if (result === true && previousResult === false) {
  //       bullishPatternData.push(candle);
  //     }
  //     if (result === false && previousResult === true) {
  //       bearishPatternData.push(candle);
  //     }
  //   }
  // });

  console.log(historicalData);
  console.log(finalResult);

  const calculateBaseInterval = () => {
    switch (interval) {
      case "15min":
        return { timeUnit: "minute", count: 15 };
      case "30min":
        return { timeUnit: "minute", count: 30 };
      case "45min":
        return { timeUnit: "minute", count: 45 };
      case "1hr":
        return { timeUnit: "hour", count: 1 };
      case "2hr":
        return { timeUnit: "hour", count: 2 };
      case "4hr":
        return { timeUnit: "hour", count: 4 };
      default:
        return { timeUnit: "minute", count: 15 };
    }
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return am5.color(color);
  };

  useLayoutEffect(() => {
    try {
    if (!historicalData.length) return;

    class MyBollingerBands extends am5stock.Indicator {

    _editableSettings = [{
      key: "period",
      name: "Period",
      type: "number"
    }, {
      key: "standardDeviation",
      name: "Standard Deviation",
      type: "number"
    }, {
      key: "seriesColor",
      name: "Color",
      type: "color"
    }, {
      key: "showFill",
      name: "Show fill",
      type: "checkbox"
    }];
    
      _afterNew() {
    
        // Set default indicator name
        this._setDefault("name", "Bollinger Bands");
        this._setDefault("period", 20);
        this._setDefault("standardDeviation", 2);
        this._setDefault("seriesColor", am5.color(0x045153));
        this._setDefault("showFill", true);
    
        // Setting up indicator elements
        var stockSeries = this.get("stockSeries");
        var chart = stockSeries.chart;
    
        if (chart) {
          var series = chart.series.push(am5xy.SmoothedXLineSeries.new(this._root, {
            valueXField: "valueX",
            valueYField: "valueY1",
            openValueYField: "valueY2",
            groupDataDisabled: true,
            calculateAggregates: true,
            xAxis: stockSeries.get("xAxis"),
            yAxis: stockSeries.get("yAxis"),
            themeTags: ["indicator"],
            name: "Bollinger Bands",
            legendLabelText: "{name}",
            legendValueText: "Upper: [bold]{valueY}[/] - Lower: [bold]{openValueY}[/]",
            legendRangeValueText: "",
            stroke: this.get("seriesColor"),
            fill: this.get("seriesColor")
          }));
    
          series.fills.template.setAll({
            fillOpacity: 0.3,
            visible: true
          });
    
          this.series = series;
          this._handleLegend(series);
        }
    
        // Don't forget inherited stuff
        super._afterNew();
      }
    
      _beforeChanged() {
    
        if (this.isDirty("margin")) {
          this.markDataDirty();
        }
    
        if (this.isDirty("seriesStyle")) {
          var style = this.get("seriesStyle");
          if (style == "Dashed") {
            this.series.strokes.template.set("strokeDasharray", [4, 4]);
          }
          else {
            this.series.strokes.template.remove("strokeDasharray");
          }
        }
    
        if (this.isDirty("showFill")) {
          this.series.fills.template.set("visible", this.get("showFill"));
        }
    
        // Don't forget inherited stuff
        super._beforeChanged();
      }
    
      prepareData() {
        // Setting up data
        var stockSeries = this.get("stockSeries");
        var dataItems = stockSeries.dataItems;
        var data = this._getDataArray(dataItems);
    
        var period = this.get("period", 20);
        var stdDev = this.get("standardDeviation", 2);
    
        am5.array.each(data, function(item, i) {
          if (i >= period - 1) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
              sum += dataItems[j].get("valueY", 0);
            }
            let avg = sum / period;
            let variance = 0;
            for (let j = i - period + 1; j <= i; j++) {
              variance += Math.pow(dataItems[j].get("valueY", 0) - avg, 2);
            }
            variance /= period;
            let stdDeviation = Math.sqrt(variance);
            item.valueY1 = avg + stdDev * stdDeviation;
            item.valueY2 = avg - stdDev * stdDeviation;
          } else {
            item.valueY1 = null;
            item.valueY2 = null;
          }
        });
    
        this.series.data.setAll(data);
      }
    
    }

    class MySMA extends am5stock.Indicator {
      _editableSettings = [{
        key: "period",
        name: "Period",
        type: "number"
      }, {
        key: "seriesColor",
        name: "Color",
        type: "color"
      }, {
        key: "field",
        name: "Field",
        type: "dropdown",
        options: ["close", "open", "high", "low"]
      }];
    
      _afterNew() {
        this._setDefault("name", "SMA");
        this._setDefault("period", 14);
        this._setDefault("seriesColor", am5.color(0x0000ff));
        this._setDefault("field", "close");
    
        var stockSeries = this.get("stockSeries");
        var chart = stockSeries.chart;
    
        if (chart) {
          var series = chart.series.push(am5xy.LineSeries.new(this._root, {
            valueXField: "valueX",
            valueYField: "valueY",
            groupDataDisabled: true,
            calculateAggregates: true,
            xAxis: stockSeries.get("xAxis"),
            yAxis: stockSeries.get("yAxis"),
            themeTags: ["indicator"],
            name: "SMA",
            legendLabelText: "{name}",
            legendValueText: "SMA: [bold]{valueY}[/]",
            stroke: this.get("seriesColor"),
          }));
    
          this.series = series;
          this._handleLegend(series);
        }
    
        super._afterNew();
      }
    
      prepareData() {
        var stockSeries = this.get("stockSeries");
        var dataItems = stockSeries.dataItems;
        var data = this._getDataArray(dataItems);
    
        var period = this.get("period", 14);
        var field = this.get("field", "close") + "ValueY";
        var fieldAlt = this.get("field", "close") === "close" ? "valueY" : field;
    
        am5.array.each(data, function(item, i) {
          if (i >= period - 1) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
              sum += dataItems[j].get(field, 0) || dataItems[j].get(fieldAlt, 0);
            }
            item.valueY = sum / period;
          } else {
            item.valueY = null;
          }
        });
    
        this.series.data.setAll(data);
      }
    }     

    class MySupertrend extends am5stock.Indicator {
      _editableSettings = [{
        key: "period",
        name: "Period",
        type: "number"
      }, {
        key: "multiplier",
        name: "Multiplier",
        type: "number"
      }, {
        key: "seriesColor",
        name: "Color",
        type: "color"
      }];
    
      _afterNew() {
        this._setDefault("name", "Supertrend");
        this._setDefault("period", 10);
        this._setDefault("multiplier", 3);
        this._setDefault("seriesColor", am5.color(0x0000ff));
    
        var stockSeries = this.get("stockSeries");
        var chart = stockSeries.chart;
    
        if (chart) {
          var series = chart.series.push(am5xy.LineSeries.new(this._root, {
            valueXField: "valueX",
            valueYField: "valueY",
            groupDataDisabled: true,
            calculateAggregates: true,
            xAxis: stockSeries.get("xAxis"),
            yAxis: stockSeries.get("yAxis"),
            themeTags: ["indicator"],
            name: "Supertrend",
            legendLabelText: "{name}",
            legendValueText: "Supertrend: [bold]{valueY}[/]",
            stroke: this.get("seriesColor"),
          }));
    
          this.series = series;
          this._handleLegend(series);
        }
    
        super._afterNew();
      }
    
      prepareData() {
        var stockSeries = this.get("stockSeries");
        var dataItems = stockSeries.dataItems;
        var data = this._getDataArray(dataItems);
    
        var period = this.get("period", 10);
        var multiplier = this.get("multiplier", 3);
    
        var atrData = [];
        var atrSum = 0;
    
        // Calculate ATR
        am5.array.each(data, function(item, i) {
          if (i > 0) {
            let high = dataItems[i].get("highValueY", 0);
            let low = dataItems[i].get("lowValueY", 0);
            let prevClose = dataItems[i - 1].get("valueY", 0);
            let tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    
            if (i < period) {
              atrSum += tr;
              atrData.push(null);
            } else if (i === period) {
              atrSum += tr;
              atrData.push(atrSum / period);
            } else {
              atrSum = (atrSum * (period - 1) + tr) / period;
              atrData.push(atrSum);
            }
          } else {
            atrData.push(null);
          }
        });
    
        // Calculate Supertrend
        let finalUpperBand = 0;
        let finalLowerBand = 0;
        let supertrend = [];
    
        am5.array.each(data, function(item, i) {
          if (i >= period) {
            let high = dataItems[i].get("highValueY", 0);
            let low = dataItems[i].get("lowValueY", 0);
            let close = dataItems[i].get("valueY", 0);
            let basicUpperBand = ((high + low) / 2) + multiplier * atrData[i];
            let basicLowerBand = ((high + low) / 2) - multiplier * atrData[i];
    
            if (i === period) {
              finalUpperBand = basicUpperBand;
              finalLowerBand = basicLowerBand;
            } else {
              if (close > finalUpperBand) {
                finalUpperBand = Math.max(basicUpperBand, finalUpperBand);
              } else {
                finalUpperBand = basicUpperBand;
              }
    
              if (close < finalLowerBand) {
                finalLowerBand = Math.min(basicLowerBand, finalLowerBand);
              } else {
                finalLowerBand = basicLowerBand;
              }
            }
    
            if (close <= finalUpperBand) {
              supertrend.push(finalUpperBand);
            } else {
              supertrend.push(finalLowerBand);
            }
          } else {
            supertrend.push(null);
          }
        });
    
        am5.array.each(data, function(item, i) {
          item.valueY = supertrend[i];
        });
    
        this.series.data.setAll(data);
      }
    }      

    const root = am5.Root.new("chart-div");
    root.setThemes([am5themes_Animated.new(root)]);

    if (historicalData && historicalData.length > 0)
      historicalData.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const stockChart = root.container.children.push(
      am5stock.StockChart.new(root, {
        wheelX: "panX",
        wheelY: "zoomX",
        panX: true,
        panY: true,
        seriesContainer: am5.Container.new(root, {
          layout: am5.Layout.fixedGrid,
          width: am5.percent(100),
          height: am5.percent(100),
          panKey: "shift",
        }),
      })
    );
    
    root.numberFormatter.set("numberFormat", "#,###.00");

    const mainPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: "zoomX",
        panX: true,
        panY: true,
      })
    );
  
    const valueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: "zoom",
        }),
        extraMin: 0.1,
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: "#,###.00",
        extraTooltipPrecision: 2,
      })
    );

    const dateAxis = mainPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: calculateBaseInterval(),
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
        skipEmptyPeriods: true,
      })
    );

    const valueSeries = mainPanel.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: " ",
        // name: selectedContract,
        clustered: false,
        valueXField: "Date",
        valueYField: "Close",
        highValueYField: "High",
        lowValueYField: "Low",
        openValueYField: "Open",
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText:
          "Open: [bold]{openValueY}[/] High: [bold]{highValueY}[/] Low: [bold]{lowValueY}[/] Close: [bold]{valueY}[/]",
        legendRangeValueText: "",
      })
    );

    const patternSeries = mainPanel.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: " ",
        clustered: false,
        valueXField: "Date",
        valueYField: "Close",
        highValueYField: "High",
        lowValueYField: "Low",
        openValueYField: "Open",
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText:
          "Open: [bold]{openValueY}[/] High: [bold]{highValueY}[/] Low: [bold]{lowValueY}[/] Close: [bold]{valueY}[/]",
        legendRangeValueText: "",
      })
    );

    const bullishPatternSeries = mainPanel.series.push(
      am5xy.CandlestickSeries.new(root, {
        // name: " ",
        clustered: false,
        valueXField: "Date",
        valueYField: "Close",
        highValueYField: "High",
        lowValueYField: "Low",
        openValueYField: "Open",
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText:
          "Open: [bold]{openValueY}[/] High: [bold]{highValueY}[/] Low: [bold]{lowValueY}[/] Close: [bold]{valueY}[/]",
        legendRangeValueText: "",
      })
    );

    const bearishPatternSeries = mainPanel.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: " ",
        clustered: false,
        valueXField: "Date",
        valueYField: "Close",
        highValueYField: "High",
        lowValueYField: "Low",
        openValueYField: "Open",
        calculateAggregates: true,
        xAxis: dateAxis,
        yAxis: valueAxis,
        legendValueText:
          "Open: [bold]{openValueY}[/] High: [bold]{highValueY}[/] Low: [bold]{lowValueY}[/] Close: [bold]{valueY}[/]",
        legendRangeValueText: "",
      })
    );

    stockChart.set("stockSeries", valueSeries);

    const valueLegend = mainPanel.plotContainer.children.push(
      am5stock.StockLegend.new(root, {
        stockChart: stockChart,
      })
    );

    const volumeAxisRenderer = am5xy.AxisRendererY.new(root, {
      inside: true,
    });

    volumeAxisRenderer.labels.template.set("forceHidden", true);
    volumeAxisRenderer.grid.template.set("forceHidden", true);

    const volumeValueAxis = mainPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        numberFormat: "#.#a",
        height: am5.percent(20),
        y: am5.percent(100),
        centerY: am5.percent(100),
        renderer: volumeAxisRenderer,
      })
    );

    const volumeSeries = mainPanel.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Volume",
        clustered: false,
        valueXField: "Date",
        valueYField: "Volume",
        xAxis: dateAxis,
        yAxis: volumeValueAxis,
        legendValueText: "[bold]{valueY.formatNumber('#,###.0a')}[/]",
      })
    );

    volumeSeries.columns.template.setAll({
      strokeOpacity: 0,
      fillOpacity: 0.5,
    });

    volumeSeries.columns.template.adapters.add("fill", function (fill, target) {
      const dataItem = target.dataItem;
      if (dataItem) {
        return stockChart.getVolumeColor(dataItem);
      }
      return fill;
    });

    stockChart.set("volumeSeries", volumeSeries);

    const secondaryPanel = stockChart.panels.push(
      am5stock.StockPanel.new(root, {
        wheelY: "zoomX",
        panX: true,
        panY: true,
        height: am5.percent(30)
      })
    );

    const secondaryValueAxis = secondaryPanel.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: "zoom",
        }),
        extraMin: 0.1,
        tooltip: am5.Tooltip.new(root, {}),
        numberFormat: "#,###.00",
        extraTooltipPrecision: 2,
      })
    );
    
    const secondaryDateAxis = secondaryPanel.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: calculateBaseInterval(),
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
        skipEmptyPeriods: true,
      })
    );

    valueLegend.data.setAll([valueSeries, volumeSeries]);

    mainPanel.set(
      "cursor",
      am5xy.XYCursor.new(root, {
        yAxis: valueAxis,
        xAxis: dateAxis,
        limitY: true,
        rangeZoom: true,
      })
    );

    const scrollbar = mainPanel.set(
      "scrollbarX",
      am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 50,
        behavior: "none",
      })
    );

    stockChart.toolsContainer.children.push(scrollbar);

    secondaryPanel.set(
      "cursor",
      am5xy.XYCursor.new(root, {
        yAxis: secondaryValueAxis,
        xAxis: secondaryDateAxis,
        limitY: true,
        rangeZoom: true,
      })
    );

    const secondaryScrollbar = secondaryPanel.set(
      "scrollbarX",
      am5xy.XYChartScrollbar.new(root, {
        orientation: "horizontal",
        height: 50,
        behavior: "none",
      })
    );

    stockChart.toolsContainer.children.push(secondaryScrollbar);

    const sbDateAxis = scrollbar.chart.xAxes.push(
      am5xy.GaplessDateAxis.new(root, {
        baseInterval: calculateBaseInterval(),
        renderer: am5xy.AxisRendererX.new(root, {}),
      })
    );

    const sbValueAxis = scrollbar.chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {
          pan: "zoom",
        }),
      })
    );

    const sbSeries = scrollbar.chart.series.push(
      am5xy.LineSeries.new(root, {
        valueYField: "Close",
        valueXField: "Date",
        xAxis: sbDateAxis,
        yAxis: sbValueAxis,
      })
    );

    sbSeries.fills.template.setAll({
      visible: true,
      fillOpacity: 0.3,
    });

    sbSeries.appear(500);

    const seriesSwitcher = am5stock.SeriesTypeControl.new(root, {
      stockChart: stockChart,
    });

    seriesSwitcher.events.on("selected", function (ev) {
      setSeriesType(ev.item.id);
    });

    function getNewSettings(series) {
      const newSettings = [];
      am5.array.each(
        [
          "name",
          "valueYField",
          "highValueYField",
          "lowValueYField",
          "openValueYField",
          "calculateAggregates",
          "valueXField",
          "xAxis",
          "yAxis",
          "legendValueText",
          "stroke",
          "fill",
        ],
        function (setting) {
          newSettings[setting] = series.get(setting);
        }
      );
      return newSettings;
    }

    function setSeriesType(seriesType) {
      const currentSeries = stockChart.get("stockSeries");
      const newSettings = getNewSettings(currentSeries);
      const data = currentSeries.data.values;
      mainPanel.series.removeValue(currentSeries);
      let series;
      switch (seriesType) {
        case "line":
          series = mainPanel.series.push(
            am5xy.LineSeries.new(root, newSettings)
          );
          break;
        case "candlestick":
        case "procandlestick":
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.CandlestickSeries.new(root, newSettings)
          );
          if (seriesType == "procandlestick") {
            series.columns.template.get("themeTags").push("pro");
          }
          break;
        case "ohlc":
          newSettings.clustered = false;
          series = mainPanel.series.push(
            am5xy.OHLCSeries.new(root, newSettings)
          );
          break;
          default:
      }
      if (series) {
        valueLegend.data.removeValue(currentSeries);
        series.data.setAll(data);
        stockChart.set("stockSeries", series);
        const cursor = mainPanel.get("cursor");
        if (cursor) {
          cursor.set("snapToSeries", [series]);
        }
        valueLegend.data.insertIndex(0, series);
      }
    }

    // Create indicator control
    var indicatorControl = am5stock.IndicatorControl.new(root, {
      stockChart: stockChart,
      legend: valueLegend
    });

    // Get current indicators
    var indicators = indicatorControl.get("indicators", []);

    // Add custom indicator to the top of the list

    indicators.unshift({
      id: "mySupertrend",
      name: "MySupertrend",
      callback: function() {
        var mySupertrend = stockChart.indicators.push(MySupertrend.new(root, {
          stockChart: stockChart,
          stockSeries: stockChart.get("stockSeries"),
          legend: valueLegend
        }));
        return mySupertrend;
      }
    });

    indicators.unshift({
      id: "myIndicator",
      name: "MyBollingerBands",
      callback: function() {
        var myIndicator = stockChart.indicators.push(MyBollingerBands.new(root, {
          stockChart: stockChart,
          stockSeries: stockChart.get("stockSeries"),
          legend: valueLegend
        }));
        return myIndicator;
      }
    });

    indicators.unshift({
      id: "mySMA",
      name: "MySMA",
      callback: function() {
        var mySMA = stockChart.indicators.push(MySMA.new(root, {
          stockChart: stockChart,
          stockSeries: stockChart.get("stockSeries"),
          legend: valueLegend
        }));
        return mySMA;
      }
    });

    // Set indicator list back
    indicatorControl.set("indicators", indicators);

    const toolbar = am5stock.StockToolbar.new(root, {
      container: document.getElementById("chartcontrols"),
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
    secondaryPanelRef.current = secondaryPanel;
    secondaryDateAxisRef.current = secondaryDateAxis;
    secondaryValueAxisRef.current = secondaryValueAxis;
    patternSeriesRef.current = patternSeries;
    bullishPatternSeriesRef.current = bullishPatternSeries;
    bearishPatternSeriesRef.current = bearishPatternSeries;
    } catch (error) {
      console.error(error);
      alert("An error occurred while rendering the chart. Please try again later.");
    }

    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, []);

  const plotSymbols = () => {
    if (!historicalData.length || !finalResult.length) return;

    patternSeriesRef.current.bullets.push(function(){
      return am5.Bullet.new(rootRef.current, {
        locationY: 1,
        sprite: am5.Triangle.new(rootRef.current, {
          width: 12,
          height: 12,
          fill: valueSeriesRef.current.get("fill"),
          rotation: 90,
          direction: "up"
        })
      });
    });
  };

  const plotBullishSymbols = () => {
    if (!historicalData.length || !finalResult.length) return;

    bullishPatternSeriesRef.current.bullets.push(function(){
      return am5.Bullet.new(rootRef.current, {
        locationY: 1,
        sprite: am5.Triangle.new(rootRef.current, {
          width: 12,
          height: 12,
          fill: am5.color(0x00ff00),
          direction: "up"
        })
      });
    });
  };

  const plotBearishSymbols = () => {
    if (!historicalData.length || !finalResult.length) return;

    bearishPatternSeriesRef.current.bullets.push(function(){
      return am5.Bullet.new(rootRef.current, {
        locationY: 1,
        sprite: am5.Triangle.new(rootRef.current, {
          width: 12,
          height: 12,
          fill: am5.color(0xff0000),
          rotation: 180,
          direction: "down"
        })
      });
    });
  };

  useLayoutEffect(() => {
    try {
    if (!historicalData.length) return;

    secondaryPanelRef.current.series.clear();

    while (mainPanelRef.current.series.length > 5) {
      const n = mainPanelRef.current.series.length - 1;
      mainPanelRef.current.series.removeIndex(n);
    }

    stockChartRef.current.data = historicalData;
    valueSeriesRef.current.data.setAll(historicalData);
    volumeSeriesRef.current.data.setAll(historicalData);
    sbSeriesRef.current.data.setAll(historicalData);
    patternSeriesRef.current.data.setAll(patternData);
    bullishPatternSeriesRef.current.data.setAll(bullishPatternData);
    bearishPatternSeriesRef.current.data.setAll(bearishPatternData);

    indicatorValues.forEach((indicator, index) => {
      if (Array.isArray(indicator.value)) {
        let indicatorData = indicator.value.map((value) => ({
          Date: value.Date,
          Value: value.Value,
        }));
        if (indicator.name==="rsi" || indicator.name==="atr" || indicator.name==="macd" || indicator.name=="stochk" || indicator.name=="stochd" || indicator.name=="cci" || indicator.name=="choppiness" || indicator.name=="change" || indicator.name=="range" || indicator.name=="bodyAbs" || indicator.name=="lowerWick" || indicator.name=="upperWick") {
          const secondaryLineSeries = secondaryPanelRef.current.series.push(
            am5xy.LineSeries.new(rootRef.current, {
              name: `${indicator.name}`,
              valueXField: "Date",
              valueYField: "Value",
              xAxis: secondaryDateAxisRef.current,
              yAxis: secondaryValueAxisRef.current,
              stroke: getRandomColor(),
              strokeWidth: 2,
              tooltip: am5.Tooltip.new(rootRef.current, {
                labelText: "{name}: {valueY}",
              }),
            })
          );
          secondaryLineSeries.data.setAll(indicatorData);
        }
        else {
          const lineSeries = mainPanelRef.current.series.push(
            am5xy.LineSeries.new(rootRef.current, {
              name: `${indicator.name}`,
              valueXField: "Date",
              valueYField: "Value",
              xAxis: dateAxisRef.current,
              yAxis: valueAxisRef.current,
              stroke: getRandomColor(),
              strokeWidth: 2,
              tooltip: am5.Tooltip.new(rootRef.current, {
                labelText: "{name}: {valueY}",
              }),
            })
          );
          lineSeries.data.setAll(indicatorData);
        }
      }
      else {
        console.error(`indicator.value is not an array for indicator: ${indicator.name}`);
      }
    });    

    if (type==true && patternSeriesRef.current && historicalData.length && finalResult.length) {
      plotSymbols();
      console.log("Plotted!");
    }

    if (type==false && bullishPatternSeriesRef.current && historicalData.length && finalResult.length) {
      plotBullishSymbols();
      console.log("Bullish Symbol Plotted!");
    }
    if (type==false && bearishPatternSeriesRef.current && historicalData.length && finalResult.length) {
      plotBearishSymbols();
      console.log("Bearish Symbol Plotted!");
    }
    
    stockChartRef.current.appear(500);
  } catch (error) {
    console.error(error);
    alert("An error occurred while rendering the chart. Please try again later.");
  }
  }, [historicalData, finalResult, indicatorValues]);

  return (
    <div style={{ display: "flex", flexDirection: "column", marginLeft: "-370px", marginTop: "40px" }}>
      <div id="chartcontrols" style={{ width: "60vw", paddingLeft: "40vw", paddingBottom: "5px" }}></div>
      <div id="chart-div" style={{ width: "75vw", height: "50vh", maxWidth: "80vw", marginLeft: "37vw" }}></div>
    </div>
  );
};

export default CSGraph;
