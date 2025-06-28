import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import './index.css';

const Login: React.FC = () => {
  const {
    username,
    password,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
  } = useAuth('login');

  return (
    <div className="container">
      <h2>Welcome to FakeStackOverflow!</h2>
      <h3>Please login to continue.</h3>
      <form onSubmit={handleSubmit}>
        <h4>Please enter your username.</h4>
        <input
          id="username"
          className="input-text"
          type="text"
          value={username}
          onChange={e => handleInputChange(e, 'username')}
        />

        <h4>Please enter your password.</h4>
        <input
          id="password"
          className="input-text"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => handleInputChange(e, 'password')}
        />

        <div className="show-password">
          <input
            id="showPasswordToggle"
            type="checkbox"
            checked={showPassword}
            onChange={togglePasswordVisibility}
          />
          <label htmlFor="showPasswordToggle">Show Password</label>
        </div>

        <button type="submit" className="login-button">
          Submit
        </button>
      </form>

      {err && <p className="error-message">{err}</p>}

      <Link to="/signup" className="signup-link">
        Don&apos;t have an account? Sign up here.
      </Link>
    </div>
  );
};

export default Login;