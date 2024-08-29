import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, query, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import ChatBot from '../components/ChatBot.js'; 
import { Plus, Minus, Trash2, Search, X } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react'; 

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
          <div className="w-full text-black border-b flex justify-between items-center pb-4 mb-4">
            {/* Left Side: Title */}
            <div className="text-md font-bold md:text-xl hidden sm:block sm:visible">
              Pantry Tracker
            </div>

            {/* Right Side: Search, Add Item, Profile Button */}
            <div className="flex items-center ml-auto">
              {/* Search Query Slide In */}
              <div className="relative flex items-center transition-all duration-300 ease-in-out">
                <div
                  className={`flex items-center space-x-2 transition-all duration-300 ease-in-out ${
                    isSearchExpanded ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'
                  } overflow-hidden`}
                >
                  <input
                    type="text"
                    className="text-black mr-2 p-1.5 border rounded-md transition-all duration-300 ease-in-out"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    setIsSearchExpanded((prev) => !prev);
                    if (isAddButtonExpanded) setIsAddButtonExpanded(false);
                  }}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-150 transition-all duration-300 ease-in-out"
                >
                  {isSearchExpanded ? <Minus /> : <Search />}
                </button>
              </div>

              {/* Add Item Button and Pop-up Logic */}
              {screenWidth < 800 ? (
                <>
                  <button
                    onClick={() => setShowAddPopup(true)}
                    className="py-1.5 px-3 mx-2 rounded-lg bg-gray-100 hover:bg-gray-150 text-lg transform transition-all duration-300 ease-in-out"
                  >
                    Add
                  </button>
                  {showAddPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white p-6 rounded-md space-y-4 w-[90%] max-w-md">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            addItem(newItem);
                            setShowAddPopup(false);
                          }}
                        >
                          <div className="flex items-center justify-between w-full pb-2">
                            <h2 className="text-lg font-semibold">Add Item</h2>
                            <button
                              onClick={() => setShowAddPopup(false)}
                              className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200"
                            >
                              <X />
                            </button>
                          </div>
                          <input
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                            className="w-full rounded-md p-2 border"
                            type="text"
                            placeholder="Enter Item"
                          />
                          <input
                            value={newItem.amount}
                            onChange={(e) =>
                              setNewItem({ ...newItem, amount: e.target.value })
                            }
                            className="w-full rounded-md p-2 border mt-2"
                            type="number"
                            placeholder="Quantity"
                            min="1"
                          />
                          <button
                            type="submit"
                            className="mt-4 w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-150 text-lg"
                          >
                            Add Item
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative flex items-center transition-all duration-300 ease-in-out">
                  <div
                    className={`relative transition-all duration-300 ease-in-out ${
                      isAddButtonExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                    } overflow-hidden`}
                  >
                    <form
                      className="flex items-center space-x-2 transition-all duration-300 ease-in-out"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addItem(newItem);
                      }}
                    >
                      <input
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem({ ...newItem, name: e.target.value })
                        }
                        className="rounded-md p-2 ml-2 border"
                        type="text"
                        placeholder="Enter Item"
                      />
                      <input
                        value={newItem.amount}
                        onChange={(e) =>
                          setNewItem({ ...newItem, amount: e.target.value })
                        }
                        className="w-[5em] rounded-md p-2 border"
                        type="number"
                        placeholder="Quantity"
                        min="1"
                      />
                      <button
                        className="py-1.5 px-4 rounded-lg bg-gray-100 hover:bg-gray-150 text-lg transform hover:scale-110 transition-all duration-300 ease-in-out"
                        type="submit"
                      >
                        +
                      </button>
                    </form>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddButtonExpanded((prev) => !prev);
                      if (isSearchExpanded) setIsSearchExpanded(false);
                    }}
                    className="py-1.5 px-3 mx-2 rounded-lg bg-gray-100 hover:bg-gray-150 text-lg transform transition-all duration-300 ease-in-out"
                  >
                    {isAddButtonExpanded ? 'Close' : 'Add'}
                  </button>
                </div>
              )}

              {/* Clerk Profile Button */}
              <UserButton afterSignOutUrl="/" className="ml-2" />
            </div>
          </div>

          {/* Main Table */}
          <div className="flex-grow flex flex-col">
            <div className="flex-grow">
              <ul className="list-none max-h-[80vh] overflow-y-auto">
                {filteredItems.length > 0 && (
                  <li className="flex text-black w-full justify-between items-center p-2 font-bold">
                    <div className="w-full flex justify-between">
                      <span className="capitalize">Item Name</span>
                      <span className="pr-10">Amount</span>
                    </div>
                  </li>
                )}
                {filteredItems.map((item, index) => (
                  <li
                    key={index}
                    className="flex w-full text-black justify-between items-center p-2"
                  >
                    <div className="w-full text-black flex justify-between items-center">
                      <span className="capitalize">{item.name}</span>
                      <div className="flex items-center ml-2">
                        <button
                          onClick={() =>
                            updateItemAmount(item.id, item.amount, 'decrease')
                          }
                          className="mr-5 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
                        >
                          <Minus />
                        </button>
                        <button
                          onClick={() =>
                            updateItemAmount(item.id, item.amount, 'increase')
                          }
                          className="mr-5 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
                        >
                          <Plus />
                        </button>
                        <span className="mx-4">{item.amount}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="ml-4 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
                    >
                      <Trash2 />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom bar for the Total */}
            <div className="flex border-t text-black justify-between pt-6">
             Total: {total}
            </div>
          </div>
        </div>

        {/* Sidechat component */}
        <ChatBot userId={user.id}/>
      </div>
    </div>
  );
}
