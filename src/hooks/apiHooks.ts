import fetchData from '@/lib/fetchData';
import { LoginResponse, UserResponse } from '@sharedTypes/MessageTypes';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

const useUser = () => {
  const getUserByToken = async (token: string) => {
    const options = {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    };
    return await fetchData<UserResponse>(
      import.meta.env.VITE_AUTH_API + '/users/token/',
      options,
    );
  };

  const getUsernameAvailable = async (username: string) => {
    return await fetchData<{ available: boolean }>(
      import.meta.env.VITE_AUTH_API + '/users/username/' + username,
    );
  };

  const getEmailAvailable = async (email: string) => {
    return await fetchData<{ available: boolean }>(
      import.meta.env.VITE_AUTH_API + '/users/email/' + email,
    );
  };

  return { getUserByToken, getUsernameAvailable, getEmailAvailable };
};

const usePasskey = () => {
  const postUser = async (user: Record<string, string>) => {
    const setupResponse = await fetchData<{
      email: string;
      options: PublicKeyCredentialCreationOptionsJSON;
    }>(import.meta.env.VITE_PASSKEY_API + '/passkey/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });

    // Otetaan options suoraan ilman optionsJSON-käärettä
    const registrationOptions = await startRegistration(setupResponse.options);

    const verifyResponse = await fetchData<UserResponse>(
      import.meta.env.VITE_PASSKEY_API + '/passkey/verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: setupResponse.email,
          registrationOptions,
        }),
      },
    );

    return verifyResponse;
  };

  const postLogin = async (email: string) => {
    const options = await fetchData<PublicKeyCredentialRequestOptionsJSON>(
      import.meta.env.VITE_PASSKEY_API + '/passkey/login-setup',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    );

    // Otetaan options suoraan ilman optionsJSON-käärettä
    const authResponse = await startAuthentication(options);

    const loginResponse = await fetchData<LoginResponse>(
      import.meta.env.VITE_PASSKEY_API + '/passkey/login-verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, authResponse }),
      },
    );

    return loginResponse;
  };

  return { postUser, postLogin };
};

export { useUser, usePasskey };