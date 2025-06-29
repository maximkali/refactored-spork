import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useGame } from '../../contexts/GameContext';
import { Bottle } from '../../types';
import './BottleManager.css';

interface FormData {
  labelName: string;
  funName: string;
  price: number;
  roundIndex: number;
}

interface BottleToDelete {
  id: string;
  name: string;
}

// Modal component for delete confirmation
const DeleteConfirmationModal = ({ isOpen, onConfirm, onCancel, bottleName }: { 
  isOpen: boolean; 
  onConfirm: () => void; 
  onCancel: () => void;
  bottleName: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete "{bottleName}"?</p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-delete">Delete</button>
        </div>
      </div>
    </div>
  );
};

interface BottleManagerProps {
  bottles: Bottle[];
  onUpdateBottles?: (bottles: Bottle[]) => void;
  showHeading?: boolean;
}

export const BottleManager: React.FC<BottleManagerProps> = ({ 
  bottles: propBottles, 
  onUpdateBottles, 
  showHeading = true 
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bottleToDelete, setBottleToDelete] = useState<BottleToDelete | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    labelName: '',
    funName: '',
    price: 0,
    roundIndex: 0
  });
  
  const { game, addBottle, updateBottle, deleteBottle } = useGame();
  const [bottles, setBottles] = useState<Bottle[]>(propBottles || game?.bottles || []);

  // Keep local state in sync with props/context
  useEffect(() => {
    setBottles(propBottles || game?.bottles || []);
  }, [propBottles, game?.bottles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newValue = name === 'price' ? parseFloat(value) || 0 : 
                     name === 'roundIndex' ? parseInt(value, 10) || 0 : 
                     value;
      return {
        ...prev,
        [name]: newValue
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.labelName) {
      alert('Please fill in the label name');
      return;
    }
    
    if (editingId) {
      // Update existing bottle
      if (onUpdateBottles) {
        onUpdateBottles(bottles.map(bottle => 
          bottle.id === editingId ? { ...bottle, ...formData } : bottle
        ));
      } else if (updateBottle) {
        updateBottle(editingId, formData);
      }
    } else {
      // Add new bottle
      const newBottle: Bottle = {
        id: uuidv4(),
        labelName: formData.labelName,
        funName: formData.funName,
        price: formData.price,
        roundIndex: formData.roundIndex
      };
      
      if (onUpdateBottles) {
        onUpdateBottles([...bottles, newBottle]);
      } else if (addBottle) {
        addBottle(newBottle);
      }
    }
    
    // Reset form
    setFormData({ labelName: '', funName: '', price: 0, roundIndex: 0 });
    setEditingId(null);
  };

  const handleEdit = (bottle: Bottle) => {
    setFormData({
      labelName: bottle.labelName,
      funName: bottle.funName ?? '',
      price: bottle.price,
      roundIndex: bottle.roundIndex
    });
    setEditingId(bottle.id);
  };

  const handleDeleteClick = (id: string, name: string) => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    setBottleToDelete({ id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (bottleToDelete && deleteBottle) {
      deleteBottle(bottleToDelete.id);
      setShowDeleteModal(false);
      setBottleToDelete(null);
    }
  };

  const cancelDelete = () => {
    // Re-enable background scrolling when modal is closed
    document.body.style.overflow = 'auto';
    setShowDeleteModal(false);
    setBottleToDelete(null);
  };

  // Cleanup function to ensure body scroll is re-enabled when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="bottle-manager">
      {showHeading && (
        <div className="section-header">
          <h3>Manage Bottles</h3>
        </div>
      )}
      
      <div className="bottle-form-container">
        <form onSubmit={handleSubmit} className="bottle-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="labelName">Label Name:</label>
              <input
                id="labelName"
                type="text"
                name="labelName"
                value={formData.labelName}
                onChange={handleInputChange}
                placeholder="e.g., Dom Pérignon 2012"
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="funName">Game Name (Optional):</label>
              <input
                id="funName"
                type="text"
                name="funName"
                value={formData.funName || ''}
                onChange={handleInputChange}
                placeholder="e.g., The Party Starter"
                className="form-control"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price:</label>
              <div className="input-with-icon">
                <span className="input-prefix">$</span>
                <input
                  id="price"
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="roundIndex">Round:</label>
              <select
                id="roundIndex"
                name="roundIndex"
                value={formData.roundIndex || ''}
                onChange={handleInputChange}
                required
                className="form-control"
              >
                <option value="">Select round</option>
                {[1, 2, 3, 4, 5].map(round => (
                  <option key={round} value={round - 1}>
                    Round {round}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <span>{editingId ? 'Update Bottle' : 'Add Bottle'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="btn-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setFormData({ labelName: '', funName: '', price: 0, roundIndex: 0 });
                  setEditingId(null);
                }}
              >
                <span>Cancel</span>
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="bottle-list">
        <div className="section-header">
          <h3>Current Bottles</h3>
        </div>
        
        {bottles.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z" clipRule="evenodd" />
            </svg>
            <h4>No bottles added yet</h4>
            <p>Add your first bottle using the form above</p>
          </div>
        ) : (
          <div className="bottles-grid">
            {bottles.map((bottle) => (
              <div key={bottle.id} className="bottle-card">
                <div className="bottle-info">
                  <h4 className="bottle-name">
                    {bottle.funName || bottle.labelName}
                    {bottle.funName && bottle.labelName && (
                      <span className="bottle-label">{bottle.labelName}</span>
                    )}
                  </h4>
                  <div className="bottle-meta">
                    <span className="bottle-price">${bottle.price.toFixed(2)}</span>
                    <span className="bottle-round">Round {bottle.roundIndex + 1}</span>
                  </div>
                </div>
                <div className="bottle-actions">
                  <button 
                    className="btn-action btn-edit"
                    onClick={() => handleEdit(bottle)}
                    aria-label={`Edit ${bottle.labelName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button 
                    className="btn-action btn-delete"
                    onClick={() => handleDeleteClick(bottle.id, bottle.labelName)}
                    aria-label={`Delete ${bottle.labelName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        bottleName={bottleToDelete?.name ?? 'this bottle'}
      />
      
      <style>{`
        .bottle-form-container {
          background: var(--bg-default);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          padding: 2rem;
          margin-bottom: 3rem;
          box-shadow: var(--shadow-sm);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 0;
        }
        
        .form-control {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: var(--text-base);
          line-height: var(--leading-normal);
          color: var(--text-primary);
          background-color: var(--bg-default);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        
        .form-control:focus {
          border-color: var(--primary);
          outline: 0;
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .input-prefix {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          pointer-events: none;
        }
        
        .input-with-icon .form-control {
          padding-left: 28px;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem;
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          line-height: var(--leading-normal);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          border: 1px solid transparent;
        }
        
        .btn-primary {
          background-color: var(--primary);
          color: white;
        }
        
        .btn-primary:hover {
          background-color: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .btn-secondary {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border);
        }
        
        .btn-secondary:hover {
          background-color: var(--bg-tertiary);
        }
        
        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-left: 0.5rem;
        }
        
        .bottles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .bottle-card {
          background: var(--bg-default);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          transition: all 0.2s ease-in-out;
        }
        
        .bottle-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .bottle-info {
          flex: 1;
        }
        
        .bottle-name {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
          display: flex;
          flex-direction: column;
        }
        
        .bottle-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--font-normal);
          margin-top: 0.25rem;
        }
        
        .bottle-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
        
        .bottle-price {
          font-weight: var(--font-medium);
          color: var(--text-primary);
        }
        
        .bottle-round {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
        }
        
        .bottle-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: var(--radius-full);
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        
        .btn-action:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .btn-action svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        
        .btn-edit:hover {
          color: var(--primary);
        }
        
        .btn-delete:hover {
          color: var(--error);
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          border: 1px dashed var(--border);
        }
        
        .empty-icon {
          width: 3rem;
          height: 3rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        
        .empty-state h4 {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }
        
        .empty-state p {
          color: var(--text-secondary);
          margin: 0;
          font-size: var(--text-base);
        }
      `}</style>
    </div>
  );
};
