import React, { useState } from 'react';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface GroupPollProps {
  onSubmit: (poll: { question: string; options: string[] }) => void;
  onClose: () => void;
}

export const GroupPollModal: React.FC<GroupPollProps> = ({ onSubmit, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;
    onSubmit({ question: question.trim(), options: validOptions });
    onClose();
  };

  return (
    <div className="poll-modal-backdrop" role="dialog" aria-labelledby="poll-modal-title">
      <div className="poll-modal-card">
        <h3 id="poll-modal-title">Create Group Poll</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="poll-question-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            required
          />
          <div className="poll-options-list">
            {options.map((opt, i) => (
              <input
                key={i}
                type="text"
                className="poll-option-input"
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                required={i < 2}
              />
            ))}
          </div>
          <div className="poll-actions">
            {options.length < 8 && (
              <button type="button" onClick={handleAddOption} className="btn-add-option">
                + Add Option
              </button>
            )}
            <button type="submit" className="btn-submit-poll">
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
