import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chef } from '../types/index';
import { addChef, updateChefOrder, deleteChef } from '../services/sessionService';

interface ContestantManagerProps {
  sessionCode: string;
  chefs: { [chefId: string]: Chef };
  onContinue: () => void;
}

const ContestantManager = ({ sessionCode, chefs, onContinue }: ContestantManagerProps) => {
  const [chefName, setChefName] = useState('');
  const [dishName, setDishName] = useState('');
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const chefList = Object.values(chefs).sort((a, b) => a.order - b.order);

  const handleAddChef = async () => {
    if (!chefName.trim()) return;

    const newChef: Chef = {
      id: `chef_${Date.now()}`,
      name: chefName.trim(),
      dish: dishName.trim() || 'mystery dish',
      order: chefList.length,
      hasCooked: false,
    };

    try {
      await addChef(sessionCode, newChef);
      setChefName('');
      setDishName('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add chef:', error);
    }
  };

  const handleRandomize = async () => {
    if (chefList.length === 0) return;

    setIsRandomizing(true);

    const shuffleOnce = () => {
      const shuffled = [...chefList];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const updatedChefs: { [chefId: string]: Chef } = {};
      shuffled.forEach((chef, index) => {
        updatedChefs[chef.id] = { ...chef, order: index };
      });

      return updatedChefs;
    };

    try {
      for (let i = 0; i < 5; i++) {
        const updatedChefs = shuffleOnce();
        await updateChefOrder(sessionCode, updatedChefs);
        
        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setTimeout(() => {
        setIsRandomizing(false);
      }, 500);
    } catch (error) {
      console.error('Failed to randomize chefs:', error);
      setIsRandomizing(false);
    }
  };

  const handleMoveUp = async (chef: Chef) => {
    if (chef.order === 0) return;

    const updatedChefs = { ...chefs };
    const prevChef = chefList[chef.order - 1];

    updatedChefs[chef.id] = { ...chef, order: chef.order - 1 };
    updatedChefs[prevChef.id] = { ...prevChef, order: prevChef.order + 1 };

    try {
      await updateChefOrder(sessionCode, updatedChefs);
    } catch (error) {
      console.error('Failed to reorder chefs:', error);
    }
  };

  const handleMoveDown = async (chef: Chef) => {
    if (chef.order === chefList.length - 1) return;

    const updatedChefs = { ...chefs };
    const nextChef = chefList[chef.order + 1];

    updatedChefs[chef.id] = { ...chef, order: chef.order + 1 };
    updatedChefs[nextChef.id] = { ...nextChef, order: nextChef.order - 1 };

    try {
      await updateChefOrder(sessionCode, updatedChefs);
    } catch (error) {
      console.error('Failed to reorder chefs:', error);
    }
  };

  const handleDeleteChef = async (chefId: string) => {
    const updatedChefs = { ...chefs };
    delete updatedChefs[chefId];

    // Reorder remaining chefs
    const remainingChefList = Object.values(updatedChefs).sort((a, b) => a.order - b.order);
    remainingChefList.forEach((chef, index) => {
      updatedChefs[chef.id] = { ...chef, order: index };
    });

    try {
      await deleteChef(sessionCode, chefId, updatedChefs);
    } catch (error) {
      console.error('Failed to delete chef:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-4 flex flex-col contestant-manager-container"
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col contestant-manager-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl md:text-3xl text-center flex-1" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-serif)' }}>
            Contestant Setup
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 py-2 px-4 rounded-lg text-lg"
            style={{
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Add Chef
          </button>
          
          {chefList.length > 1 && (
            <button
              onClick={handleRandomize}
              disabled={isRandomizing}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-charcoal)',
                border: '2px solid var(--color-charcoal)',
                cursor: isRandomizing ? 'not-allowed' : 'pointer',
                opacity: isRandomizing ? 0.5 : 1,
              }}
            >
              {isRandomizing ? 'Shuffling...' : 'Shuffle'}
            </button>
          )}
        </div>

        {/* Chef List - Scrollable */}
        <div className="flex-1 overflow-y-auto mb-3" style={{ minHeight: 0 }}>
          {chefList.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
              layout
            >
              {chefList.map((chef, index) => (
                <motion.div
                  key={chef.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                  }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg border-2"
                  style={{
                    backgroundColor: 'var(--color-cream)',
                    borderColor: 'var(--color-charcoal)',
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(chef)}
                      disabled={index === 0}
                      style={{
                        color: 'var(--color-charcoal)',
                        background: 'none',
                        border: 'none',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.3 : 1,
                        minHeight: 'auto',
                        minWidth: 'auto',
                        padding: '0.25rem',
                        fontSize: '1rem',
                      }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveDown(chef)}
                      disabled={index === chefList.length - 1}
                      style={{
                        color: 'var(--color-charcoal)',
                        background: 'none',
                        border: 'none',
                        cursor: index === chefList.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === chefList.length - 1 ? 0.3 : 1,
                        minHeight: 'auto',
                        minWidth: 'auto',
                        padding: '0.25rem',
                        fontSize: '1rem',
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-lg truncate" style={{ color: 'var(--color-charcoal)' }}>
                      {chef.name}
                    </p>
                    <p className="text-sm italic truncate" style={{ color: 'var(--color-charcoal)', opacity: 0.7 }}>
                      {chef.dish}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xl font-serif" style={{ color: 'var(--color-gold)' }}>
                      #{index + 1}
                    </div>
                    <button
                      onClick={() => handleDeleteChef(chef.id)}
                      style={{
                        color: 'var(--color-burgundy)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        minHeight: 'auto',
                        minWidth: 'auto',
                        padding: '0.25rem',
                      }}
                      title="Delete chef"
                    >
                      ×
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--color-charcoal)', opacity: 0.5 }}>
              <p className="text-lg">No chefs added yet</p>
              <p className="text-sm">Click "Add Chef" to get started</p>
            </div>
          )}
        </div>

        {/* Continue Button */}
        {chefList.length > 0 && (
          <button
            onClick={onContinue}
            className="w-full py-2 px-4 rounded-lg text-lg"
            style={{
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Continue to Game
          </button>
        )}
      </div>

      {/* Add Chef Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 50,
              }}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 51,
                width: '90%',
                maxWidth: '400px',
              }}
            >
              <h2 className="text-2xl font-serif mb-4" style={{ color: 'var(--color-charcoal)' }}>
                Add Chef
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={chefName}
                  onChange={(e) => setChefName(e.target.value)}
                  placeholder="Chef Name"
                  autoFocus
                  className="w-full py-3 px-4 border-2 rounded-lg"
                  style={{
                    borderColor: 'var(--color-charcoal)',
                    backgroundColor: 'var(--color-cream)',
                    color: 'var(--color-charcoal)',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChef()}
                />

                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Dish Name (optional)"
                  className="w-full py-3 px-4 border-2 rounded-lg"
                  style={{
                    borderColor: 'var(--color-charcoal)',
                    backgroundColor: 'var(--color-cream)',
                    color: 'var(--color-charcoal)',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChef()}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 px-4 border-2 rounded-lg"
                    style={{
                      borderColor: 'var(--color-charcoal)',
                      color: 'var(--color-charcoal)',
                      backgroundColor: 'transparent',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddChef}
                    disabled={!chefName.trim()}
                    className="flex-1 py-2 px-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--color-gold)',
                      color: 'var(--color-charcoal)',
                      fontFamily: 'var(--font-serif)',
                      border: 'none',
                      cursor: !chefName.trim() ? 'not-allowed' : 'pointer',
                      opacity: !chefName.trim() ? 0.5 : 1,
                    }}
                  >
                    Add Chef
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ContestantManager;
