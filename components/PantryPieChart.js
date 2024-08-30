import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useUser } from '@clerk/clerk-react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const PantryPieChart = () => {
  const { user } = useUser(); // Get the current user from Clerk
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    if (!user) return; // Wait for user to be defined

    const fetchData = async () => {
      const q = query(collection(db, 'items'), where('userId', '==', user.id)); // Query items by user ID
      const querySnapshot = await getDocs(q);

      const itemNames = [];
      const itemAmounts = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        itemNames.push(data.name);
        itemAmounts.push(data.amount);
      });

      // Set the chart data
      setChartData({
        labels: itemNames,
        datasets: [
          {
            label: 'Items in Pantry',
            data: itemAmounts,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ], // Colors for different items
            hoverBackgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      });
    };

    fetchData();
  }, [user]);

  return (
    <div className="bg-white border rounded-lg p-6 min-w-[350px]">
      <h2 className="text-xl font-semibold mb-4">Pantry Items Distribution</h2>
      {chartData.labels ? (
        <Pie data={chartData} />
      ) : (
        <p>Loading chart...</p>
      )}
    </div>
  );
};

export default PantryPieChart;
