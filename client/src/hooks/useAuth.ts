import { ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useLoginContext from './useLoginContext';
import { createUser, loginUser } from '../services/userService';
import { User, UserCredentials } from '../types';

/**
 * Custom hook to manage authentication logic for both login and signup.
 */
const useAuth = (authType: 'login' | 'signup') => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  // Toggle visibility of password field
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Handle input changes for username, password, and confirmation
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'username' | 'password' | 'confirmPassword'
  ) => {
    const value = e.target.value;
    switch (field) {
      case 'username':
        setUsername(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setPasswordConfirmation(value);
        break;
    }
  };

  // Validate inputs based on authType
  const validateInputs = (): boolean => {
    if (!username.trim()) {
      setErr('Username is required');
      return false;
    }
    if (!password.trim()) {
      setErr('Password is required');
      return false;
    }
    if (authType === 'signup') {
      if (!passwordConfirmation.trim()) {
        setErr('Password confirmation is required');
        return false;
      }
      if (password !== passwordConfirmation) {
        setErr('Passwords do not match');
        return false;
      }
    }
    setErr('');
    return true;
  };

  // Handle form submission for login or signup
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) return;

    const creds: UserCredentials = { username, password };
    try {
      let user: User;
      if (authType === 'login') {
        user = await loginUser(creds);
      } else {
        user = await createUser(creds);
      }
      setUser(user);
      navigate('/home');
    } catch (error: any) {
      setErr(error.message || 'An error occurred');
    }
  };

  return {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    togglePasswordVisibility,
    handleInputChange,
    handleSubmit,
  };
};

export default useAuth;