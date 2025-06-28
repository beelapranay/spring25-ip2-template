import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import './index.css';

const Signup: React.FC = () => {
  const {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
  } = useAuth('signup');

  return (
    <div className="container">
      <h2>Sign up for FakeStackOverflow!</h2>
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

        <h4>Please confirm your password.</h4>
        <input
          id="confirmPassword"
          className="input-text"
          type={showPassword ? 'text' : 'password'}
          value={passwordConfirmation}
          onChange={e => handleInputChange(e, 'confirmPassword')}
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

      <Link to="/" className="login-link">
        Have an account? Login here.
      </Link>
    </div>
  );
};

export default Signup;