import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

import type { ItemGroupInterface, ItemCollectionInterface, ItemInterface, AppDataInterface } from '@/types/item/Item';
import type { InitialState } from '@/types/InitialState';
import { routes } from '@/routes';
import type { ImageEntity } from '@server/db/entities/image.entity';

type AppStoreInterface = AppDataInterface & InitialState;

const initialState: AppStoreInterface = {
  loadingStatus: 'idle',
  error: null,
  items: [],
  itemGroups: [],
  itemCollections: [],
};

export interface ItemResponseInterface {
  code: number;
  item: ItemInterface;
}

export interface ItemWithUrlResponseInterface {
  code: number;
  item: ItemInterface;
  url: string;
}

export interface ItemGroupResponseInterface {
  code: number;
  itemGroup: ItemGroupInterface;
}

export interface ItemCollectionResponseInterface {
  code: number;
  itemCollection: ItemCollectionInterface;
}

export const addItem = createAsyncThunk(
  'app/addItem',
  async (data: ItemInterface, { rejectWithValue }) => {
    try {
      const response = await axios.post<ItemWithUrlResponseInterface>(routes.createItem, data);
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
      const response = await axios.put<ItemWithUrlResponseInterface>(routes.crudItem(id), data);
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
      const response = await axios.delete<ItemResponseInterface>(routes.crudItem(id));
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
      const response = await axios.patch<ItemResponseInterface>(routes.crudItem(id));
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
      const response = await axios.post<ItemGroupResponseInterface>(routes.createItemGroup, data);
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
      const response = await axios.put<ItemGroupResponseInterface>(routes.crudItemGroup(data.id), data);
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
      const response = await axios.delete<ItemGroupResponseInterface>(routes.crudItemGroup(id));
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
      const response = await axios.patch<ItemGroupResponseInterface>(routes.crudItemGroup(id));
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
      const response = await axios.post<ItemCollectionResponseInterface>(routes.createItemCollection, data);
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
      const response = await axios.put<ItemCollectionResponseInterface>(routes.crudItemCollection(data.id), data);
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
      const response = await axios.delete<ItemCollectionResponseInterface>(routes.crudItemCollection(id));
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
      const response = await axios.patch<ItemCollectionResponseInterface>(routes.crudItemCollection(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const deleteItemImage = createAsyncThunk(
  'app/deleteItemImage',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<{ code: number; image: ImageEntity; }>(routes.imageDelete(id));
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
    setAppData: (state, { payload }: PayloadAction<AppDataInterface>) => {
      state.items = payload.items;
      state.itemGroups = payload.itemGroups;
      state.itemCollections = payload.itemCollections;
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
      })
      .addCase(deleteItemImage.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(deleteItemImage.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const index = state.items.findIndex((item) => item.images.find(({ id }) => id === payload.image.id));
          if (index !== -1) {
            state.items[index].images = state.items[index].images.filter(({ id }) => id !== payload.image.id);
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(deleteItemImage.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      });
  },
});

export const { setAppData } = appSlice.actions;

export default appSlice.reducer;
