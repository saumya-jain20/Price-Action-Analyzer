import { Box, Grid, Paper } from '@mui/material';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import React, { useState } from 'react';
import { FormControl } from '@mui/material';
import { InputLabel } from '@mui/material';
import { Stack } from '@mui/material';

const CorrelationPopup = ({
  correlationData,
  contracts,
  onClose,
  closecorrelationData,
  deltacorrelationData,
}) => {
  const getColor = (value) => {
    const green = { r: 175, g: 255, b: 210 };
    const red = { r: 255, g: 190, b: 200 };
    const white = { r: 255, g: 255, b: 255 };
    if (value === 0) {
      return `rgb(${white.r}, ${white.g}, ${white.b})`;
    }
    const interpolate = (start, end, factor) =>
      Math.round(start + (end - start) * factor);
    if (value > 0) {
      return `rgb(${interpolate(white.r, green.r, value)}, ${interpolate(white.g, green.g, value)}, ${interpolate(white.b, green.b, value)})`;
    } else {
      return `rgb(${interpolate(white.r, red.r, -value)}, ${interpolate(white.g, red.g, -value)}, ${interpolate(white.b, red.b, -value)})`;
    }
  };

  const [correlationType, setCorrelationType] = useState('Close');

  const handleChange = (event) => {
    setCorrelationType(event.target.value);
  };

  return (
    <Box sx={{ mt: "-50vh", 'z-index': 100  }} position={"absolute"} borderColor="primary.main">
      <Paper variant="elevation" style={{height: "44vh",width: "60.2vw"}} sx={{backgroundColor: '#ebf8fc'}}>
        <Grid container sx={{ p: 1 }}  >
          <Grid item xs={12}>
            <Stack spacing={2} display={'flex'} justifyContent={'left'} alignContent={'center'} direction={'row'} style={{ marginBottom: '10px' }}>
              <Button variant="contained" size='small' onClick={onClose} style={{ height: 40 }}>
                Close
              </Button>

              <FormControl>
                <InputLabel id="CorrelationType-Select">Type</InputLabel>
                <Select
                  labelId="CorrelationType-Select"
                  id="correlationSelecion"
                  value={correlationType}
                  label="Correlation Type"
                  onChange={handleChange}
                  style={{ height: 40 }}
                >
                  <MenuItem value="Close">Close</MenuItem>
                  <MenuItem value="Delta">Delta</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          <Grid item xs={12} style={{ maxHeight: '33vh', maxWidth: '60vw',  overflowY: 'auto' }}>
            <div>
              <table className="table-bordered">
                {correlationType === 'Close' ? (
                  <tbody>
                    <tr>
                      <th></th>
                      {contracts.map((contract, index) => (
                        <td key={index} style={{fontWeight: 'bold'}}>{contract}</td>
                      ))}
                    </tr>
                    {closecorrelationData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td style={{fontWeight: 'bold'}}>{contracts[rowIndex]}</td>
                        {row.map((value, colIndex) => (
                          <td
                            key={colIndex}
                            style={{ backgroundColor: getColor(value)  }}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody>
                    <tr>
                      <th></th>
                      {contracts.map((contract, index) => (
                        <td key={index} style={{fontWeight: 'bold'}}>{contract}</td>
                      ))}
                    </tr>
                    {deltacorrelationData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        <td style={{fontWeight: 'bold'}}>{contracts[rowIndex]}</td>
                        {row.map((value, colIndex) => (
                          <td
                            key={colIndex}
                            style={{ backgroundColor: getColor(value) }}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default CorrelationPopup;
