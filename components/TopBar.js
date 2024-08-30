import React from 'react';
import { Minus, Search, X, LayoutDashboard } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';

const TopBar = ({
  searchQuery,
  setSearchQuery,
  isSearchExpanded,
  setIsSearchExpanded,
  isAddButtonExpanded,
  setIsAddButtonExpanded,
  screenWidth,
  showAddPopup,
  setShowAddPopup,
  newItem,
  setNewItem,
  addItem,
}) => {
  return (
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
  );
};

export default TopBar;
