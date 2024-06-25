// src/AppBarStyles.js
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

// Style for the CardHeader component
export const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main, // use theme color
  color: theme.palette.common.white, // text color
  textAlign: 'center', // center align text
  padding: theme.spacing(0), // spacing
}));

// Style for the Typography component
export const CenteredTypography = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  justifyContent: 'center',
  fontWeight: 'bold', // Make text bold
}));

// Example logo, replace with your own
export const logo =
  'https://futuresfirst.com/wp-content/uploads/2019/12/ff.png';

// Style for the logo image
export const Logo = styled('img')({
  height: '40px', // Adjust height as needed
  marginRight: '16px', // Spacing between logo and text
});
