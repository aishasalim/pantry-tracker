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
      const itemName = name.trim().toLowerCase();
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
  
  // Similar changes apply for deleteItemFromPantry and updateItemQuantity...
  
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