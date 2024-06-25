import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.handleRefresh = this.handleRefresh.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);

    // Log the error to a server or service
    // logErrorToService(error, errorInfo);

    // You might want to replace the alert with a more user-friendly notification
    alert('An error occurred. Please try again.');

    // For critical errors, consider displaying a message to the user
    // instead of automatically refreshing the page
    this.handleRefresh();
  }

  handleRefresh() {
    // You might want to provide a more user-friendly way to trigger a refresh
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // Consider rendering a more user-friendly error message
      return <h1>Something went wrong. Please try again.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
