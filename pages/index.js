import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase.js';

import { Plus, Minus, Trash2, Search, X } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react'; 

import ChatBot from '../components/ChatBot.js'; 
import TopBar from '../components/TopBar.js';
import PantryTable from '../components/PantryTable.js'; 

export default function Home() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', amount: 1 });
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isAddButtonExpanded, setIsAddButtonExpanded] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [showAddPopup, setShowAddPopup] = useState(false);
  
  const { user } = useUser(); // Get the current user from Clerk

  const addItem = async (item) => {
    if (item.name !== '' && item.amount !== '') {
      await addDoc(collection(db, 'items'), {
        name: item.name.trim(),
        amount: parseFloat(item.amount),
        userId: user.id, // Associate item with the user ID
      });
      setNewItem({ name: '', amount: 1 });
    }
  };

  useEffect(() => {
    if (!user) return; // Wait for the user to be defined

    const q = query(collection(db, 'items'), where('userId', '==', user.id)); // Query items by user ID
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);

      const totalAmount = itemsArr.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );
      setTotal(totalAmount);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (e) {
      console.error('Error deleting item: ', e);
    }
  };

  const updateItemAmount = async (id, amount, action) => {
    try {
      const itemDoc = doc(db, 'items', id);
      if (action === 'increase') {
        await updateDoc(itemDoc, {
          amount: amount + 1,
        });
      } else if (action === 'decrease') {
        if (amount > 1) {
          await updateDoc(itemDoc, {
            amount: amount - 1,
          });
        } else if (amount === 1) {
          await deleteItem(id);
        }
      }
    } catch (e) {
      console.error(
        `Error ${action === 'increase' ? 'increasing' : 'decreasing'} item amount: `,
        e
      );
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-grow flex">
        <div className="flex-grow flex flex-col px-4 md:px-6 py-4">
          {/* Topbar for the Main Table */}
          <TopBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearchExpanded={isSearchExpanded}
            setIsSearchExpanded={setIsSearchExpanded}
            isAddButtonExpanded={isAddButtonExpanded}
            setIsAddButtonExpanded={setIsAddButtonExpanded}
            screenWidth={screenWidth}
            showAddPopup={showAddPopup}
            setShowAddPopup={setShowAddPopup}
            newItem={newItem}
            setNewItem={setNewItem}
            addItem={addItem}
          />

          {/* Main Table */}
          <PantryTable 
            items={items}
            filteredItems={filteredItems}
            updateItemAmount={updateItemAmount}
            deleteItem={deleteItem}
            total={total}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Sidechat component */}
        <ChatBot userId={user.id}/>
      </div>
    </div>
  );
}
