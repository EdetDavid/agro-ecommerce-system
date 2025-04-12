import React, { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); 
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const userKey = user?.user?.id ? `cart_${user.user.id}` : "cart_guest";
    console.log("CartContext: Determined userKey:", userKey);
    console.log("CartContext: Current user object:", user);
    const storedCart = localStorage.getItem(userKey);
    if (storedCart) setCart(JSON.parse(storedCart));
  }, [user]);

  useEffect(() => {
    const userKey = user?.user?.id ? `cart_${user.user.id}` : "cart_guest";
    console.log("CartContext: Saving cart to userKey:", userKey);
    localStorage.setItem(userKey, JSON.stringify(cart));
  }, [cart, user]);

  const addItem = (item) => {
    setCart((prev) => [...prev, item]);
  };

  const removeItem = (itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};