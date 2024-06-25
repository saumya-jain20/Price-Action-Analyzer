import React from 'react';
import {
  useMsal,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react';
import { loginRequest } from '../auth-config';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import { Toolbar } from '@mui/material';
import {
  CenteredTypography,
  Logo,
  logo,
  StyledCardHeader,
} from './Header.style';

export default function AppBarWithLogo() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance
      .loginPopup({
        ...loginRequest,
        prompt: 'select_account',
      })
      .catch((error) => console.log(error));
    instance
      .loginPopup({
        ...loginRequest,
        prompt: 'select_account',
      })
      .catch((error) => console.log(error));
  };

  const handleLogout = () => {
    instance.logout();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Logo src={logo} alt="Logo" />
        <CenteredTypography variant="h5" component="div">
          Price Action DashBoard
        </CenteredTypography>
        <AuthenticatedTemplate>
          <Button variant="contained" onClick={handleLogout}>
            LOGOUT
          </Button>
        </AuthenticatedTemplate>
        <UnauthenticatedTemplate>
          <Button variant="contained" onClick={handleLogin}>
            LOGIN
          </Button>
        </UnauthenticatedTemplate>
      </Toolbar>
    </AppBar>
  );
}
