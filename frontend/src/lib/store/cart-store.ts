/* ── Cart Store (Zustand) ── */

import { create } from 'zustand';
import api from '@/lib/api';
import type { Cart } from '@/lib/types';

interface CartState {
    cart: Cart | null;
    isLoading: boolean;

    fetchCart: () => Promise<void>;
    addToCart: (productId: string, quantity?: number) => Promise<void>;
    updateItem: (itemId: string, quantity: number) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
    cart: null,
    isLoading: false,

    fetchCart: async () => {
        set({ isLoading: true });
        try {
            const res = await api.get<Cart>('/api/cart');
            set({ cart: res.data, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },

    addToCart: async (productId: string, quantity = 1) => {
        set({ isLoading: true });
        try {
            const res = await api.post<Cart>('/api/cart/add', {
                product_id: productId,
                quantity,
            });
            set({ cart: res.data, isLoading: false });
        } catch {
            set({ isLoading: false });
            throw new Error('Failed to add to cart');
        }
    },

    updateItem: async (itemId: string, quantity: number) => {
        set({ isLoading: true });
        try {
            const res = await api.put<Cart>('/api/cart/update', {
                item_id: itemId,
                quantity,
            });
            set({ cart: res.data, isLoading: false });
        } catch {
            set({ isLoading: false });
            throw new Error('Failed to update cart');
        }
    },

    removeItem: async (itemId: string) => {
        set({ isLoading: true });
        try {
            const res = await api.delete<Cart>(`/api/cart/remove/${itemId}`);
            set({ cart: res.data, isLoading: false });
        } catch {
            set({ isLoading: false });
            throw new Error('Failed to remove item');
        }
    },
}));
