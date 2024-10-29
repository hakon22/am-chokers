import { useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { fetchTokenStorage, removeUrl, updateTokens } from '@/slices/userSlice';
import { AuthContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { routes } from '@/routes';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

export const useAuthHandler = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logIn, loggedIn } = useContext(AuthContext);
  const { token, refreshToken, url } = useAppSelector((state) => state.user);

  useEffect(() => {
    const tokenStorage = window.localStorage.getItem(storageKey);
    if (tokenStorage) {
      dispatch(fetchTokenStorage(tokenStorage));
    }
  }, []);

  useEffect(() => {
    if (token && !loggedIn) {
      logIn();
      router.push(url ?? routes.personalData);
      dispatch(removeUrl());
    }
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    if (refreshToken) {
      const fetch = () => dispatch(updateTokens(refreshToken));

      const timeAlive = setTimeout(fetch, 595000);
      return () => clearTimeout(timeAlive);
    }
    return undefined;
  }, [refreshToken]);
};
