import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

import { routes } from '@/routes';
import type { ItemGroupInterface, ItemCollectionInterface, ItemInterface, AppDataInterface } from '@/types/item/Item';
import type { InitialState } from '@/types/InitialState';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { CommentEntity } from '@server/db/entities/comment.entity';
import type { PaginationEntityInterface, PaginationInterface, PaginationSearchInterface } from '@/types/PaginationInterface';
import type { ReplyComment } from '@/types/app/comment/ReplyComment';

type AppStoreInterface = AppDataInterface & InitialState & { axiosAuth: boolean; pagination: PaginationInterface; };

const initialState: AppStoreInterface = {
  loadingStatus: 'idle',
  error: null,
  axiosAuth: false,
  itemGroups: [],
  specialItems: [],
  coverImages: [],
  pagination: {
    count: 0,
    limit: 0,
    offset: 0,
  },
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

export interface GradeResponseInterface {
  code: number;
  grade: ItemGradeEntity;
}

export interface CommentResponseInterface {
  code: number;
  comment: CommentEntity;
}

export interface ImageResponseInterface {
  code: number;
  image: ImageEntity;
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
  async ({ id, data }: { id: number, data: ItemInterface; }, { rejectWithValue }) => {
    try {
      const response = await axios.put<ItemWithUrlResponseInterface>(routes.crudItem(id), data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const partialUpdateItem = createAsyncThunk(
  'app/partialUpdateItem',
  async ({ id, data }: { id: number, data: Partial<ItemInterface>; }, { rejectWithValue }) => {
    try {
      const response = await axios.patch<ItemWithUrlResponseInterface>(routes.crudItem(id), data);
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
      const response = await axios.get<ItemResponseInterface>(routes.restoreItem(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const publishItem = createAsyncThunk(
  'app/publishItem',
  async ({ id, description }: { id: number; description?: string; }, { rejectWithValue }) => {
    try {
      const response = await axios.post<ItemResponseInterface>(routes.publishToTelegram(id), { description });
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

export const sortItemGroup = createAsyncThunk(
  'app/sortItemGroup',
  async (data: { id: number; }[], { rejectWithValue }) => {
    try {
      const response = await axios.post<{ code: number; itemGroups: ItemGroupInterface[]; }>(routes.sortItemGroup, data);
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
      const response = await axios.put<ItemCollectionResponseInterface>(routes.crudItemCollection(data?.id), data);
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

export const getItemGrades = createAsyncThunk(
  'app/getItemGrades',
  async ({ id, limit, offset }: PaginationSearchInterface, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.getGrades({ isServer: false, id }), {
        params: {
          limit,
          offset,
        },
      });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const createComment = createAsyncThunk(
  'app/createComment',
  async (data: ReplyComment, { rejectWithValue }) => {
    try {
      const response = await axios.post<CommentResponseInterface>(routes.createComment, data);
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeGrade = createAsyncThunk(
  'app/removeGrade',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<GradeResponseInterface>(routes.removeGrade(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const setCoverImage = createAsyncThunk(
  'app/setCoverImage',
  async ({ id, coverOrder }: {id: number; coverOrder: number; }, { rejectWithValue }) => {
    try {
      const response = await axios.post<ImageResponseInterface>(routes.setCoverImage, { id, coverOrder });
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const removeCoverImage = createAsyncThunk(
  'app/removeCoverImage',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await axios.delete<ImageResponseInterface>(routes.removeCoverImage(id));
      return response.data;
    } catch (e: any) {
      return rejectWithValue(e.response.data);
    }
  },
);

export const setSpecialItems = createAsyncThunk(
  'app/setSpecialItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<{ code: number; specialItems: ItemInterface[]; }>(routes.getItemSpecials({ isServer: true }));
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
      state.itemGroups = payload.itemGroups;
      state.specialItems = payload.specialItems;
      state.coverImages = payload.coverImages;
    },
    addSpecialItem: (state, { payload }: PayloadAction<ItemInterface>) => {
      state.specialItems = [...state.specialItems, payload];
    },
    removeSpecialItem: (state, { payload }: PayloadAction<ItemInterface>) => {
      state.specialItems = state.specialItems.filter((item) => item.id !== payload.id);
    },
    setPaginationParams: (state, { payload }: PayloadAction<PaginationInterface>) => {
      state.pagination = payload;
    },
    setAxiosAuth: (state, { payload }: PayloadAction<boolean>) => {
      state.axiosAuth = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addItemGroup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(addItemGroup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.itemGroups = [payload.itemGroup, ...state.itemGroups];
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
      .addCase(partialUpdateItem.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(partialUpdateItem.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          const itemIndex = state.specialItems.findIndex((item) => item.id === payload.item.id);
          if (itemIndex !== -1) {
            state.specialItems[itemIndex] = payload.item;
          }
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(partialUpdateItem.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(setCoverImage.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(setCoverImage.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.coverImages = [...state.coverImages, payload.image];
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(setCoverImage.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(removeCoverImage.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(removeCoverImage.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.coverImages = state.coverImages.filter((image) => image.id !== payload.image.id);
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(removeCoverImage.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(setSpecialItems.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(setSpecialItems.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.specialItems = payload.specialItems;
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(setSpecialItems.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      })
      .addCase(sortItemGroup.pending, (state) => {
        state.loadingStatus = 'loading';
        state.error = null;
      })
      .addCase(sortItemGroup.fulfilled, (state, { payload }) => {
        if (payload.code === 1) {
          state.itemGroups = payload.itemGroups;
        }
        state.loadingStatus = 'finish';
        state.error = null;
      })
      .addCase(sortItemGroup.rejected, (state, { payload }: PayloadAction<any>) => {
        state.loadingStatus = 'failed';
        state.error = payload.error;
      });
  },
});

export const { setAppData, setAxiosAuth, addSpecialItem, removeSpecialItem, setPaginationParams } = appSlice.actions;

export default appSlice.reducer;
