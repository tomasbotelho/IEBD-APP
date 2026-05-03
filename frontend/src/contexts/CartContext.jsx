import { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "appiebd_cart";
const FREE_DELIVERY_THRESHOLD = 60;
const DEFAULT_DELIVERY_FEE = 4.9;

const readStoredItems = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const normalizeQuantity = (value) => Math.max(0, Number.parseInt(value, 10) || 0);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => readStoredItems());

  const syncItems = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  };

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const subtotal = Number(
      items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0)
        .toFixed(2)
    );
    const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_DELIVERY_FEE;
    const total = Number((subtotal + deliveryFee).toFixed(2));

    return {
      items,
      count,
      subtotal,
      deliveryFee,
      total,
      addItem: (product, quantity = 1) => {
        const requestedQuantity = normalizeQuantity(quantity);

        if (!product || requestedQuantity <= 0) {
          return { ok: false, message: "Selecione uma quantidade válida." };
        }

        if (Number(product.stock || 0) <= 0) {
          return { ok: false, message: "Sem stock disponível para este produto." };
        }

        const existing = items.find((item) => item.id === product.id);
        const nextQuantity = Number(existing?.quantity || 0) + requestedQuantity;

        if (nextQuantity > Number(product.stock || 0)) {
          return {
            ok: false,
            message: "A quantidade pedida excede o stock disponível."
          };
        }

        if (existing) {
          syncItems(
            items.map((item) =>
              item.id === product.id
                ? {
                    ...item,
                    ...product,
                    quantity: nextQuantity
                  }
                : item
            )
          );
        } else {
          syncItems([...items, { ...product, quantity: requestedQuantity }]);
        }

        return { ok: true };
      },
      updateQuantity: (productId, quantity) => {
        const target = items.find((item) => item.id === productId);

        if (!target) {
          return { ok: false, message: "Produto não encontrado no carrinho." };
        }

        const normalized = normalizeQuantity(quantity);
        if (normalized <= 0) {
          syncItems(items.filter((item) => item.id !== productId));
          return { ok: true };
        }

        if (normalized > Number(target.stock || 0)) {
          syncItems(
            items.map((item) =>
              item.id === productId
                ? { ...item, quantity: Number(item.stock || 0) }
                : item
            )
          );
          return {
            ok: false,
            message: "A quantidade pedida excede o stock disponível."
          };
        }

        syncItems(
          items.map((item) =>
            item.id === productId ? { ...item, quantity: normalized } : item
          )
        );

        return { ok: true };
      },
      removeItem: (productId) => {
        syncItems(items.filter((item) => item.id !== productId));
      },
      clearCart: () => {
        syncItems([]);
      }
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
