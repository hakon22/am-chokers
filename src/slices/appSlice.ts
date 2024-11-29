import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

import type { ItemGroupInterface, ItemCollectionInterface, ItemInterface, ItemsAndGroupsInterface } from '@/types/item/Item';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';

interface AppStoreInterface extends ItemsAndGroupsInterface, InitialState {
  itemCollections: ItemCollectionInterface[];
}

const initialState: AppStoreInterface = {
  loadingStatus: 'idle',
  error: null,
  items: [],
  itemGroups: [],
  itemCollections: [],
};

export const addItem = createAsyncThunk(
  'app/addItem',
  async (data: ItemInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number; item: ItemInterface; url: string; }>(routes.createItem, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const updateItem = createAsyncThunk(
  'app/updateItem',
  async ({ id, data }: { id: number, data: Partial<ItemInterface> }, { rejectWithValue }) => {
    try {
      const response = await axios.put<{ code: number; item: ItemInterface; }>(routes.crudItem(id), data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const deleteItem = createAsyncThunk(
  'app/deleteItem',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; item: ItemInterface; }>(routes.crudItem(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const restoreItem = createAsyncThunk(
  'app/restoreItem',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.patch<{ code: number; item: ItemInterface; }>(routes.crudItem(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const addItemGroup = createAsyncThunk(
  'app/addItemGroup',
  async (data: ItemGroupInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number; itemGroup: ItemGroupInterface; }>(routes.createItemGroup, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const updateItemGroup = createAsyncThunk(
  'app/updateItemGroup',
  async (data: ItemGroupInterface, { rejectWithValue }) => {
    try {
      const response = await axios.put<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItemGroup(data.id), data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const deleteItemGroup = createAsyncThunk(
  'app/deleteItemGroup',
  async (id: number | React.Key, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItemGroup(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const restoreItemGroup = createAsyncThunk(
  'app/restoreItemGroup',
  async (id: number | React.Key, { rejectWithValue }) => {
    try {
      const response = await axios.patch<{ code: number; itemGroup: ItemGroupInterface; }>(routes.crudItemGroup(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const addItemCollection = createAsyncThunk(
  'app/addItemCollection',
  async (data: ItemCollectionInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number; itemCollection: ItemCollectionInterface; }>(routes.createItemCollection, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const updateItemCollection = createAsyncThunk(
  'app/updateItemCollection',
  async (data: ItemCollectionInterface, { rejectWithValue }) => {
    try {
      const response = await axios.put<{ code: number; itemCollection: ItemCollectionInterface; }>(routes.crudItemCollection(data.id), data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const deleteItemCollection = createAsyncThunk(
  'app/deleteItemCollection',
  async (id: number | React.Key, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; itemCollection: ItemCollectionInterface; }>(routes.crudItemCollection(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const restoreItemCollection = createAsyncThunk(
  'app/restoreItemCollection',
  async (id: number | React.Key, { rejectWithValue }) => {
    try {
      const response = await axios.patch<{ code: number; itemCollection: ItemCollectionInterface; }>(routes.crudItemCollection(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
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
    setItemsCollections: (state, { payload }: PayloadAction<ItemCollectionInterface[]>) => {
      state.itemCollections = payload;
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
      .addCase(addItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
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
      .addCase(updateItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(deleteItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.items = state.items.filter((item) => item.id !== payload.item.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(deleteItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
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
      .addCase(restoreItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
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
      .addCase(addItemGroup.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
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
      .addCase(updateItemGroup.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
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
      .addCase(deleteItemGroup.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
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
      .addCase(restoreItemGroup.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(addItemCollection.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(addItemCollection.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.itemCollections = [...state.itemCollections, payload.itemCollection];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(addItemCollection.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(updateItemCollection.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(updateItemCollection.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const itemCollectionIndex = state.itemGroups.findIndex((itemCollection) => itemCollection.id === payload.itemCollection.id);
          if (itemCollectionIndex !== -1) {
            state.itemCollections[itemCollectionIndex] = payload.itemCollection;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(updateItemCollection.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(deleteItemCollection.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteItemCollection.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.items = state.items
            .filter((item) => item.collection)
            .map((item) => {
              if (item.collection.id === payload.itemCollection.id) {
                return { ...item, collection: null } as unknown as ItemInterface;
              }
              return item;
            });
          state.itemCollections = state.itemCollections.filter((itemCollection) => itemCollection.id !== payload.itemCollection.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(deleteItemCollection.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(restoreItemCollection.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(restoreItemCollection.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.itemCollections = [...state.itemCollections, payload.itemCollection];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(restoreItemCollection.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      });
  },
});

export const { setItemsAndGroups, setItemsCollections } = appSlice.actions;

export default appSlice.reducer;
