import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

import type { ItemGroupInterface, ItemInterface, ItemsAndGroupsInterface } from '@/types/item/Item';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';

const initialState: ItemsAndGroupsInterface & InitialState = {
  loadingStatus: 'idle',
  error: null,
  items: [],
  itemGroups: [],
};

export const addItem = createAsyncThunk(
  'app/addItem',
  async (data: ItemInterface) => {
    const response = await axios.post<{ code: number; item: ItemInterface; url: string; }>(routes.createItem, data);
    return response.data;
  },
);

export const updateItem = createAsyncThunk(
  'app/updateItem',
  async (data: ItemInterface) => {
    const response = await axios.put<{ code: number; item: ItemInterface; }>(routes.crudItem(data.id), data);
    return response.data;
  },
);

export const deleteItem = createAsyncThunk(
  'app/deleteItem',
  async (id: number) => {
    const response = await axios.delete<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItem(id));
    return response.data;
  },
);

export const restoreItem = createAsyncThunk(
  'app/restoreItem',
  async (id: number) => {
    const response = await axios.patch<{ code: number; item: ItemInterface; }>(routes.crudItem(id));
    return response.data;
  },
);

export const addItemGroup = createAsyncThunk(
  'app/addItemGroup',
  async (data: ItemGroupInterface) => {
    const response = await axios.post<{ code: number; itemGroup: ItemGroupInterface; }>(routes.createItemGroup, data);
    return response.data;
  },
);

export const updateItemGroup = createAsyncThunk(
  'app/updateItemGroup',
  async (data: ItemGroupInterface) => {
    const response = await axios.put<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItemGroup(data.id), data);
    return response.data;
  },
);

export const deleteItemGroup = createAsyncThunk(
  'app/deleteItemGroup',
  async (id: number | React.Key) => {
    const response = await axios.delete<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItemGroup(id));
    return response.data;
  },
);

export const restoreItemGroup = createAsyncThunk(
  'app/restoreItemGroup',
  async (id: number | React.Key) => {
    const response = await axios.patch<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItemGroup(id));
    return response.data;
  },
);

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setItemsAndGroups: (state, { payload }: PayloadAction<ItemsAndGroupsInterface>) => {
      state.items = payload.items;
      state.itemGroups = payload.itemGroups;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.items = [...state.items, payload.item];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(addItem.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(updateItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const itemIndex = state.items.findIndex((item) => item.id === payload.item.id);
          if (itemIndex !== -1) {
            state.items[itemIndex] = payload.item;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(deleteItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.items = state.items.filter((item) => item.id !== payload.itemGroup.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(restoreItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(restoreItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.items = [...state.items, payload.item];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(restoreItem.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(addItemGroup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(addItemGroup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.itemGroups = [...state.itemGroups, payload.itemGroup];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(addItemGroup.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(updateItemGroup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateItemGroup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const itemGroupIndex = state.itemGroups.findIndex((itemGroup) => itemGroup.id === payload.itemGroup.id);
          if (itemGroupIndex !== -1) {
            state.itemGroups[itemGroupIndex] = payload.itemGroup;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateItemGroup.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(deleteItemGroup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteItemGroup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.items = state.items.filter((item) => item.group.id !== payload.itemGroup.id);
          state.itemGroups = state.itemGroups.filter((itemGroup) => itemGroup.id !== payload.itemGroup.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(deleteItemGroup.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      })
      .addCase(restoreItemGroup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(restoreItemGroup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.itemGroups = [...state.itemGroups, payload.itemGroup];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(restoreItemGroup.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message ?? null;
      });
  },
});

export const { setItemsAndGroups } = appSlice.actions;

export default appSlice.reducer;
