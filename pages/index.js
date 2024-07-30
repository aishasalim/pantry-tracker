import React, { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import {
  collection,
  addDoc,
  updateDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from "../firebase.js";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", amount: 0 });
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== '' && newItem.amount !== '') {
      await addDoc(collection(db, 'items'), {
        name: newItem.name.trim(),
        amount: parseFloat(newItem.amount),
      });
      setNewItem({ name: '', amount: 0 });
    }
  };

  // Read from firebase
  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);

      // Calculate total
      const totalAmount = itemsArr.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );
      setTotal(totalAmount);
    });
    return () => unsubscribe();
  }, []);

  // Delete item from firebase
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'items', id));
  };

  // Reduce item by 1
  const reduceItem = async (id, amount) => {
    if (amount > 1) {
      try {
        const itemDoc = doc(db, 'items', id);
        await updateDoc(itemDoc, {
          amount: amount - 1,
        });
      } catch (e) {
        console.error("Error reducing item amount: ", e);
      }
    } else {
      deleteItem(id);
    }
  };
  const plusItem = async (id, amount) => {
    if (amount > 1) {
      try {
        const itemDoc = doc(db, 'items', id);
        await updateDoc(itemDoc, {
          amount: amount + 1,
        });
      } catch (e) {
        console.error("Error reducing item amount: ", e);
      }
    } else {
      deleteItem(id);
    }
  };


  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="z-10 w-full max-w-3xl items-center justify-center font-mono text-sm">
        <h1 className='text-4xl pb-10 text-center'>Pantry Tracker</h1>
        <div className='bg-zinc-100 shadow-lg p-4 rounded-lg w-full'>
          <form className='grid grid-cols-6 gap-2 items-center text-black' onSubmit={addItem}>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className='col-span-3 rounded-md p-2 border'
              type='text'
              placeholder='Enter Item'
            />
            <input
              value={newItem.amount}
              onChange={(e) =>
                setNewItem({ ...newItem, amount: e.target.value })}
              className='col-span-2 rounded-md p-2 border'
              type='number'
              placeholder='Enter Quantity'
            />
            <button
              className='text-white bg-slate-950 rounded-md hover:bg-slate-500 p-2 text-lg'
              type='submit'>
              Add
            </button>
          </form>
          <input
            type="text"
            className="w-full mt-4 p-2 border rounded-md"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className='overflow-y-auto h-64 mt-4'>
            <ul>
              {filteredItems.length > 0 && (
                <li className='flex w-full justify-between items-center p-2 font-bold'>
                  <div className='w-full flex justify-between'>
                    <span className='capitalize'>Item Name</span>
                    <span className="pr-9">Amount</span>
                  </div>
                </li>
              )}
              {filteredItems.map((item, index) => (
                <li
                  key={index}
                  className='flex w-full justify-between items-center p-2'>
                  <div className='w-full flex justify-between items-center'>
                    <span className='capitalize'>{item.name}</span>
                    <div className='flex items-center'>
                      <button
                        onClick={() => reduceItem(item.id, item.amount)}
                        className='mr-5 p-2 border rounded-md border-slate-900 transform hover:scale-110 transition-transform duration-300'>
                        -
                      </button>
                      <button
                        onClick={() => plusItem(item.id, item.amount)}
                        className='mr-10 p-2 border rounded-md border-slate-900 transform hover:scale-110 transition-transform duration-300'>
                        +
                      </button>
                      <span>{item.amount}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className='ml-4 py-2 px-4 border rounded-md border-slate-900 transform hover:scale-110 transition-transform duration-300'>
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {filteredItems.length > 0 && (
            <div className='flex justify-between mt-4 p-2'>
              <span>Total</span>
              <span>{total}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}