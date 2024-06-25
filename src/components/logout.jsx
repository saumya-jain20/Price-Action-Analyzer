import React from 'react';

const Logout = ({ instance }) => {
  const handleLogout = () => {
    instance.logout();
  };

  return (
    <button onClick={handleLogout} className="header-link">
      LOGOUT
    </button>
  );
};

export default Logout;
