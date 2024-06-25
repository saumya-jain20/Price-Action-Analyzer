import { createTheme } from '@mui/material/styles';

const darktheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#556cd6',
      light: '#778beb',
      dark: '#345bbf',
    },
    secondary: {
      main: '#19857b',
      light: '#4ebaaa',
      dark: '#136b64',
    },
    background: {
      default: '#121212',
      paper: '#121212',
    },
    text: {
      primary: '#d2d3d9',
      secondary: '#d2d3d9',
    },
    customButton: {
      main: '#2da200', // light green
      contrastText: '#000',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.MuiButton-containedPrimary': {
            backgroundColor: '#2d53b5',
            '&:hover': {
              backgroundColor: '#032d87',
            },
          },
          '&.MuiButton-containedSecondary': {
            backgroundColor: '#d60e61',
            '&:hover': {
              backgroundColor: '#9c0258',
            },
          },
          '&.MuiButton-containedCustom': {
            backgroundColor: '#2da200',
            color: '#000',
            '&:hover': {
              backgroundColor: '#006c00',
            },
          },
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: 'rgba(21,101,192,1)',
      },
    },
  },
});

const theme  = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#007BFF', // Blue
    },
    secondary: {
      main: '#FF5733', // Orange
    },
    background: {
      default: '#121212', // Dark background
      paper: '#1D1D1D',   // Slightly lighter for paper components
    },
    text: {
      primary: '#FFFFFF', // White text
      secondary: '#B0B0B0', // Light gray for secondary text
    },
    success: {
      main: '#28A745', // Green for success
    },
    error: {
      main: '#DC3545', // Red for error
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
        },
      },
    },
  },
});


export default theme;
