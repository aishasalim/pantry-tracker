import React from 'react';

const RecipeModal = ({ isOpen, onClose, recipe }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-[90%] max-w-md">
        <div className="flex justify-between items-center pb-2">
          <h2 className="text-xl font-semibold">{recipe.title}</h2>
          <button onClick={onClose} className="text-black p-2 hover:bg-gray-200 rounded-md">X</button>
        </div>
        <div>
          <p className="mb-2"><strong>Minutes Takes:</strong> {recipe.minutesTakes} mins</p>
          <p><strong>Steps:</strong> {recipe.steps}</p>
        </div>
        <button
          onClick={onClose}
          className="mt-4 py-1.5 px-4 rounded-lg bg-gray-100 hover:bg-gray-150 text-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default RecipeModal;
