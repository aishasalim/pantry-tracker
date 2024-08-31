import { getTogetherClient } from '../../togetherClient'; 
import { addDoc, deleteDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase.js'; 

const systemInstructions = `
You are a Pantry Tracker Support ChatBot. You assist users with managing their pantry items, including adding, editing, and deleting items within the database.

When you want to perform an action (like adding, deleting, or updating an item), you must respond with a JSON object in the following format:

{
  "response": "Your message to the user.",
  "tasks": [
    {
      "action": "add" or "delete" or "update",
      "itemName": "Name of the item",
      "itemCount": 1 (if adding, otherwise omit for deleting),
      "updateAction": "increase" or "decrease" (required only for updates)
    }
  ]
}

Always respond in JSON format, and never deviate from this structure when performing actions.

FAQ Section:
1. What is this system for?
"This system is designed to help users manage their pantry inventory by adding, editing, and removing items, and keeping track of item quantities and details."

2. How do I add an item to my pantry?
"To add an item to your pantry, click on the 'Add Item' button, fill in the item name, quantity, and other details, then click 'Save'."

3. How can I update an item’s details?
"To update an item, find it in your inventory list, click the edit icon next to the item, make your changes, and press 'Save'."

4. How do I remove an item from my pantry?
"To remove an item, locate it in your pantry list, click the delete icon next to the item, and confirm the deletion."

5. Can I search for specific items in my pantry?
"Yes, use the search bar at the top of the inventory list to type the name of the item you’re looking for."

6. How do I generate a shopping list from my pantry?
"Currently, the system does not generate shopping lists directly. However, you can manually note items with low quantities and add them to your shopping list."

Rules for Chatbot Responses:
- The AI assistant can only assist with actions related to managing items in the pantry database, such as adding, editing, and deleting items.
- The AI must not provide suggestions or advice outside of item management functions.
- The AI’s responses will strictly adhere to the defined functions of data management within the pantry tracker.

Possible User Questions and Answers:
1. Q: How do I increase the quantity of an existing item?
   A: "To increase the quantity press plus on the item."

2. Q: Can I change the name of an item in the pantry?
   A: "Currently, you can only recreate an item."

3. Q: Can I export my pantry data?
   A: "Export functionality is currently not supported directly. Please manage data within the system to ensure accurate tracking."

System Guidelines:
- "Ensure that item names are unique to avoid confusion."
- "Maintain accurate quantities and expiration dates to optimize inventory tracking."
- "Always confirm your actions when adding or deleting items to prevent data loss."

Error Handling Prompts:
1. Q: What if I see an error when trying to save an item?
   A: "Please ensure all required fields are filled correctly. If the issue persists, refresh the page and try again."

2. Q: What happens if an item is deleted by mistake?
   A: "Unfortunately, once an item is deleted, it cannot be restored. Please be careful when deleting items."
`;

// Helper function to add an item to the pantry associated with the correct user
async function addItemToPantry(name, count, userId) {
    try {
      const itemName = name.trim().toLowerCase(); // Standardize the item name to lowercase
      await addDoc(collection(db, 'items'), {
        name: itemName,
        amount: count,
        userId: userId, // Include the user ID
      });
      console.log(`Added ${count} ${itemName} to pantry for user ${userId}.`);
      return { success: true, message: `${count} ${itemName} have been added to your pantry.` };
    } catch (error) {
      console.error(`Error adding item ${name}:`, error);
      return { success: false, message: `Error adding ${name}. Please try again.` };
    }
  }
  
  // Helper function to delete an item associated with the correct user
  async function deleteItemFromPantry(name, userId) {
    try {
      const itemName = name.trim().toLowerCase(); // Standardize the item name to lowercase
      const q = query(collection(db, 'items'), where('name', '==', itemName), where('userId', '==', userId));
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
        console.error(`Item ${itemName} not found for deletion.`);
        return { success: false, message: `Item ${itemName} not found in your pantry.` };
      }
  
      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
      console.log(`Deleted ${itemName} from pantry for user ${userId}.`);
      return { success: true, message: `${itemName} has been deleted from your pantry.` };
    } catch (error) {
      console.error(`Error deleting item ${name}:`, error);
      return { success: false, message: `Error deleting ${name}. Please try again.` };
    }
  }
  
  // Helper function to update item quantity associated with the correct user
  async function updateItemQuantity(name, newQuantity, userId) {
    const itemName = name.trim().toLowerCase(); // Standardize the item name to lowercase
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const q = query(collection(db, 'items'), where('name', '==', itemName), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.error(`Item ${itemName} not found on attempt ${attempt + 1}.`);
          attempt += 1;
          if (attempt === maxRetries) {
            return { success: false, message: `Item ${itemName} not found in your pantry.` };
          }
          await new Promise((resolve) => setTimeout(resolve, 200)); // Wait before retrying
          continue;
        }

        if (typeof newQuantity !== 'number' || isNaN(newQuantity)) {
          console.error(`Invalid new quantity: ${newQuantity}`);
          return { success: false, message: `Invalid quantity provided for ${itemName}.` };
        }

        snapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, { amount: newQuantity });
          console.log(`Item ${itemName} updated to ${newQuantity} for user ${userId}.`);
        });

        return { success: true, message: `The quantity of ${itemName} has been updated to ${newQuantity}.` };
      } catch (error) {
        console.error(`Error updating quantity of ${itemName} on attempt ${attempt + 1}:`, error);
        attempt += 1;
        if (attempt === maxRetries) {
          return { success: false, message: `Error updating the quantity of ${itemName}. Please try again.` };
        }
        await new Promise((resolve) => setTimeout(resolve, 200)); // Wait before retrying
      }
    }
  }

  // Function to generate a recipe using AI
  async function generateRecipe(userId, selectedIngredients) {
    try {
      // Ensure that we have selected ingredients to generate a recipe
      if (selectedIngredients.length === 0) {
        console.error('No ingredients selected for generating a recipe.');
        return { success: false, message: 'Please select ingredients for generating a recipe.' };
      }

      // Convert selected ingredients into a single prompt for AI
      const ingredientsPrompt = selectedIngredients.join(', ');

      // Use Together AI client to generate the recipe
      const together = getTogetherClient();
      const aiResponse = await together.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates cooking recipes based on provided ingredients.' },
          { role: 'user', content: `Create a recipe using the following ingredients: ${ingredientsPrompt}. Provide the recipe title, cooking steps, and estimated time.` }
        ],
        model: 'gpt-3.5-turbo', // Choose the AI model you prefer
        max_tokens: 512,
        temperature: 0.7,
      });

      // Extract generated recipe data from AI response
      const recipeContent = aiResponse.choices[0].message.content;
      const recipeTitle = recipeContent.match(/Title: (.+)/)?.[1] || 'Generated Recipe';
      const recipeSteps = recipeContent.match(/Steps:([\s\S]*)/)?.[1]?.trim() || 'No steps provided.';
      const recipeMinutesTakes = recipeContent.match(/Estimated Time: (\d+)/)?.[1] || 'N/A';

      // Add the generated recipe to the 'recipes' collection in Firebase
      await addDoc(collection(db, 'recipes'), {
        title: recipeTitle,
        steps: recipeSteps,
        minutesTakes: recipeMinutesTakes,
        createdAt: new Date(),
        userId: userId,
      });

      console.log(`Generated recipe "${recipeTitle}" for user ${userId}.`);
      return { success: true, message: `Generated recipe "${recipeTitle}".`, recipeTitle, recipeMinutesTakes, recipeSteps };
    } catch (error) {
      console.error(`Error generating recipe for user ${userId}:`, error);
      return { success: false, message: `Error generating recipe. Please try again.` };
    }
  }

  export default async function handler(req, res) {
    console.log('Received request:', req.method, req.body);
  
    if (req.method === 'POST') {
      const { messages, inventory, userId } = req.body; // Receive userId from the request
  
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated.' });
      }
  
      console.log('Messages:', messages);
      console.log('Inventory:', inventory);
  
      try {
        const together = getTogetherClient();
        console.log('Together client initialized successfully.');
  
        // Call Together API
        const response = await together.chat.completions.create({
          messages: [
            { role: 'system', content: systemInstructions },
            ...messages,
          ],
          model: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
          max_tokens: 512,
          temperature: 0.7,
        });
  
        console.log('AI response received:', response);
  
        if (response.choices && response.choices[0] && response.choices[0].message) {
          let aiResponseContent = response.choices[0].message.content;
  
          // Extract JSON from response
          const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiResponseContent = jsonMatch[0];
          }
  
          try {
            const aiResponse = JSON.parse(aiResponseContent);
  
            // Execute tasks from AI response
            if (aiResponse.tasks && aiResponse.tasks.length > 0) {
              for (const task of aiResponse.tasks) {
                let result;
                if (task.action === 'add') {
                  result = await addItemToPantry(task.itemName, task.itemCount || 1, userId);
                } else if (task.action === 'delete') {
                  result = await deleteItemFromPantry(task.itemName, userId);
                } else if (task.action === 'update') {
                  result = await updateItemQuantity(task.itemName, task.itemCount, userId);
                } else if (task.action === 'generateRecipe') { // Handle generate recipe action
                  result = await generateRecipe(userId);
                }
  
                if (!result.success) {
                  res.status(400).json(result.message);
                  return;
                }
              }
            }
  
            res.status(200).json(aiResponse.response || 'Task executed successfully.');
          } catch (parseError) {
            console.error('Error parsing AI response as JSON:', parseError.message);
            res.status(200).json({
              response: "AI response could not be parsed as JSON. Returning plain text response.",
              originalResponse: aiResponseContent,
            });
          }
        } else {
          throw new Error('Unexpected response format from Together AI.');
        }
      } catch (error) {
        console.error('Error in Together AI request:', error.message);
        res.status(500).json({ error: 'Failed to get AI response: ' + error.message });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }