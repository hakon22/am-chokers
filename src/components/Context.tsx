import { createContext } from 'react';

import type { ItemInterface } from '@/types/item/Item';

export const AuthContext = createContext<{
  loggedIn: boolean,
  logIn:() => void,
  logOut: () => Promise<void>,
    }>({
      loggedIn: false,
      logIn: () => undefined,
      logOut: async () => undefined,
    });

export const SubmitContext = createContext<{
  isSubmit: boolean,
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>,
    }>({
      isSubmit: false,
      setIsSubmit: () => undefined,
    });

export const NavbarContext = createContext<{
  isActive: boolean,
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>,
  closeNavbar:() => void,
    }>({
      isActive: false,
      setIsActive: () => undefined,
      closeNavbar: () => undefined,
    });

export const ScrollContext = createContext<{
  scrollBar?: number,
  setMarginScroll:() => void,
    }>({
      scrollBar: 0,
      setMarginScroll: () => undefined,
    });

export const ItemContext = createContext<{ item?: ItemInterface; setItem: React.Dispatch<React.SetStateAction<ItemInterface | undefined>>; }>({
  item: undefined,
  setItem: () => undefined,
});

export const SearchContext = createContext<{ isSearch?: { value: boolean; needFetch: boolean; }; setIsSearch: React.Dispatch<React.SetStateAction<{ value: boolean; needFetch: boolean; }>>; }>({
  isSearch: undefined,
  setIsSearch: () => undefined,
});
