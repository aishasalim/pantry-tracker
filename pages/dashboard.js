import React, { useState, useEffect } from 'react';
import { useUser, UserButton } from '@clerk/clerk-react';
import PantryPieChart from '../components/PantryPieChart.js';
import TopItemsList from '../components/TopItemsList.js';
import RecipeModal from '../components/RecipeModal.js'; // Import the modal component
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

const Dashboard = () => {
  const { user } = useUser(); // Get the current user from Clerk
  const [recipes, setRecipes] = useState([]); // State for recipes
  const [pantryItems, setPantryItems] = useState([]); // State for pantry items
  const [selectedItems, setSelectedItems] = useState([]); // State for selected items
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [currentRecipe, setCurrentRecipe] = useState(null); // State for current recipe to show in modal

  useEffect(() => {
    if (!user) return; // Wait for the user to be defined

    // Fetch pantry items from Firebase
    const fetchPantryItems = async () => {
      const q = query(collection(db, 'items'), where('userId', '==', user.id)); // Query items by user ID
      const querySnapshot = await getDocs(q);
      let itemsArr = [];
      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setPantryItems(itemsArr);
    };

    fetchPantryItems();
  }, [user]);

  // Fetch generated recipes from Firebase
  const fetchRecipes = async () => {
    if (!user) return; // Wait for the user to be defined

    const q = query(collection(db, 'recipes'), where('userId', '==', user.id)); // Query recipes by user ID
    const querySnapshot = await getDocs(q);
    let recipesArr = [];
    querySnapshot.forEach((doc) => {
      recipesArr.push({ ...doc.data(), id: doc.id });
    });
    setRecipes(recipesArr);
  };

  useEffect(() => {
    fetchRecipes(); // Call fetchRecipes when component mounts or user changes
  }, [user]);

  // Function to generate a recipe using AI
  async function generateRecipe(userId, selectedIngredients) {
    try {
      // Mock AI call to generate recipe steps
      const recipeTitle = `Recipe with ${selectedIngredients.slice(0, 3).join(', ')}`;
      const recipeSteps = `1. Combine ${selectedIngredients.join(', ')}. 2. Cook for 30 minutes. 3. Serve hot.`;
      const recipeMinutesTakes = 30;

      // Add the generated recipe to the 'recipes' collection
      await addDoc(collection(db, 'recipes'), {
        title: recipeTitle,
        minutesTakes: recipeMinutesTakes,
        steps: recipeSteps,
        createdAt: new Date(),
        userId: userId,
      });

      console.log(`Generated recipe "${recipeTitle}" for user ${userId}.`);
      return { success: true, message: `Generated recipe "${recipeTitle}".`, recipeTitle, recipeMinutesTakes };
    } catch (error) {
      console.error(`Error generating recipe for user ${userId}:`, error);
      return { success: false, message: `Error generating recipe. Please try again.` };
    }
  }

  const handleCheckboxChange = (itemId) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(itemId)
        ? prevSelected.filter((id) => id !== itemId)
        : [...prevSelected, itemId]
    );
  };

  const handleGenerateRecipe = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to generate a recipe.');
      return;
    }

    const selectedPantryItems = pantryItems.filter((item) =>
      selectedItems.includes(item.id)
    );

    const ingredientNames = selectedPantryItems.map((item) => item.name);
    const result = await generateRecipe(user.id, ingredientNames);

    if (result.success) {
      alert(result.message);
      fetchRecipes(); // Fetch updated recipes to refresh the UI
    } else {
      alert(result.message);
    }
  };

  // Handle opening the modal with the recipe details
  const handleOpenModal = (recipe) => {
    setCurrentRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCurrentRecipe(null);
    setIsModalOpen(false);
  };

  return (
<div className="flex h-screen flex-col">
  <div className="flex-grow flex overflow-y-auto">
    <div className="flex-grow flex flex-col px-4 md:px-6 py-4">
      {/* Topbar for the Main Table */}
      <div className="w-full text-black border-b flex justify-between items-center pb-4 mb-4">
        <div className="text-md font-bold md:text-xl">Dashboard</div>
        <div className="flex items-center ml-auto">
          {/* Back to Main Button */}
          <button
            onClick={() => window.location.href = '/'}
            className="py-1.5 px-3 mx-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-lg transform transition-all duration-300 ease-in-out"
          >
            Main Page
          </button>
          {/* Clerk Profile Button */}
          <UserButton afterSignOutUrl="/" className="ml-2" />
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex flex-col-reverse lg:flex-row gap-10">  {/* Changed to flex-col-reverse on small screens */}
        {/* Left Side: Pie Chart and Top Items */}
        <div className="flex flex-col items-start md:w-full lg:w-full p-4">  {/* Adjust width on large screens */}
          <div className="w-[25em] mx-5">
            <PantryPieChart />
          </div>
          <div className="w-[10em] mx-5 ">
            <TopItemsList />
          </div>
        </div>

        {/* Right Side: Recipes Table */}
        <div className="lg:w-4/5 mt-4 mx-5 lg:ml-auto">
          {/* Generate Recipe Button */}
          <button
            onClick={handleGenerateRecipe}
            className="py-1.5 mx-5 px-3 mb-2 rounded-lg bg-green-100 hover:bg-green-200 text-lg transform transition-all duration-300 ease-in-out"
          >
            Generate Recipe
          </button>
          {/* Current Pantry Items with Checkboxes */}
          <div className="flex-grow p-4 mx-5 rounded-lg border mb-5 min-w-[5em] max-h-[18em]">
            <ul className="list-none max-h-[80vh] overflow-y-auto">
              {pantryItems.length > 0 && (
                <li className="flex text-black w-full justify-between items-center p-2 font-bold">
                  <div className="w-full flex justify-between">
                    <span className="capitalize">Checked</span>
                    <span className="capitalize">Item Name</span>
                  </div>
                </li>
              )}
              {pantryItems.map((item, index) => (
                <li
                  key={index}
                  className="flex w-full text-black justify-between items-center p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-full text-black flex justify-between items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="mr-3"
                    />
                    <span className="capitalize">{item.amount} (pcs) {item.name}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Generated Recipes Table */}
          <div className="border p-4 mx-5 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Generated Recipes</h2>
            {recipes.length > 0 ? (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Minutes Takes</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Generated At</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <tr key={recipe.id}>
                      <td className="border border-gray-300 px-4 py-2">
                        {/* Recipe Name Link to Open Modal */}
                        <a href="#" onClick={() => handleOpenModal(recipe)} className="text-blue-500 hover:underline">
                          {recipe.title}
                        </a>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">{recipe.minutesTakes} mins</td>
                      <td className="border border-gray-300 px-4 py-2">{new Date(recipe.createdAt.toDate()).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No recipes generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Recipe Modal Component */}
  <RecipeModal isOpen={isModalOpen} onClose={handleCloseModal} recipe={currentRecipe} />
</div>

  );
};

export default Dashboard;
