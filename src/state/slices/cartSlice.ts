import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getCart, type CartItem } from '@/api/cart';
import type { RootState } from '../store';

interface CartState {
  items: CartItem[];
  count: number;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetched: number | null;
}

const initialState: CartState = {
  items: [],
  count: 0,
  status: 'idle',
  error: null,
  lastFetched: null,
};

const extractCartItems = (payload: unknown): CartItem[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload as CartItem[];
  }

  if (typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;

    if (Array.isArray(candidate.cartItems)) {
      return candidate.cartItems as CartItem[];
    }

    if (
      candidate.data &&
      typeof candidate.data === 'object' &&
      Array.isArray((candidate.data as Record<string, unknown>).cartItems)
    ) {
      return (candidate.data as { cartItems: CartItem[] }).cartItems;
    }
  }

  return [];
};

type CartError = {
  message?: string;
  errors?: string[];
};

export const fetchCart = createAsyncThunk<CartItem[], void, { rejectValue: string }>(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCart();
      return extractCartItems(response);
    } catch (error: unknown) {
      const fallback = 'Không thể tải giỏ hàng, vui lòng thử lại.';
      if (typeof error === 'object' && error !== null) {
        const cartError = error as CartError;
        const message = cartError.errors?.[0] ?? cartError.message ?? fallback;
        return rejectWithValue(message);
      }
      return rejectWithValue(fallback);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.count = 0;
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
    setCartFromPayload: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.count = action.payload.reduce((sum, item) => sum + (item?.quantity ?? 0), 0);
      state.lastFetched = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.count = action.payload.reduce((sum, item) => sum + (item?.quantity ?? 0), 0);
        state.lastFetched = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message || 'Không thể tải giỏ hàng';
        state.items = [];
        state.count = 0;
      });
  },
});

export const { resetCart, setCartFromPayload } = cartSlice.actions;

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectCartCount = (state: RootState) => state.cart.count;
export const selectCartStatus = (state: RootState) => state.cart.status;
export const selectCartError = (state: RootState) => state.cart.error;

export default cartSlice.reducer;

