import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useUser } from '@clerk/clerk-react';

const TopItemsList = () => {
  const { user } = useUser(); // Get the current user from Clerk
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    if (!user) return; // Wait for user to be defined

    const fetchTopItems = async () => {
        const q = query(
          collection(db, 'items'),
          where('userId', '==', user.id),  // Filter by user ID
          orderBy('amount', 'desc'),       // Order by amount descending
          limit(5)                         // Limit to top 5 items
        );
      
        const querySnapshot = await getDocs(q);
        const itemsArray = [];
      
        querySnapshot.forEach((doc) => {
          itemsArray.push({ ...doc.data(), id: doc.id });
        });
      
        setTopItems(itemsArray);
      };

    fetchTopItems();
  }, [user]);

  return (
    <div className="bg-white border rounded-lg p-4 mt-8 min-w-[350px]">
      <h2 className="text-xl font-semibold mb-4">Top 5 Items</h2>
      {topItems.length > 0 ? (
        <ul>
          {topItems.map((item) => (
            <li key={item.id} className="flex justify-between mb-2">
              <span className="capitalize">{item.name}</span>
              <span className="font-bold">{item.amount}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading top items...</p>
      )}
    </div>
  );
};

export default TopItemsList;
