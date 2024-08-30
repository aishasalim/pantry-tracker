import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

const PantryTable = ({ items, filteredItems, updateItemAmount, deleteItem, total, searchQuery, setSearchQuery }) => {
  return (
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
                    onClick={() => updateItemAmount(item.id, item.amount, 'decrease')}
                    className="mr-5 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-150 transform hover:scale-110 transition-transform duration-300"
                  >
                    <Minus />
                  </button>
                  <button
                    onClick={() => updateItemAmount(item.id, item.amount, 'increase')}
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
  );
};

export default PantryTable;
