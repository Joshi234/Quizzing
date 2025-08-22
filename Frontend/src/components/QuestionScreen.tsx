import React from 'react';
import type { QuestionMessage } from '../types/game';
import { Button } from './Button';
import { Timer } from './Timer';

interface QuestionScreenProps {
  question: QuestionMessage;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
  answerLocked: boolean;
  timeRemaining: number;
  onSelectOption: (option: 'A' | 'B' | 'C' | 'D') => void;
  onSubmitAnswer: () => void;
}

export const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  selectedOption,
  answerLocked,
  timeRemaining,
  onSelectOption,
  onSubmitAnswer,
}) => {
  const options: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Quiz Question</h1>
          <Timer timeRemaining={timeRemaining} totalTime={question.durationMs} />
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white leading-relaxed">
            {question.text}
          </h2>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => !answerLocked && onSelectOption(option)}
              disabled={answerLocked}
              className={`p-6 rounded-lg text-left transition-all duration-200 border-2 ${
                selectedOption === option
                  ? 'bg-blue-700 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-500'
              } ${
                answerLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  selectedOption === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {option}
                </div>
                <div className="flex-1">
                  <p className="text-lg">{question.options[option]}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Submit Button */}
        <div className="text-center">
          {answerLocked ? (
            <div className="bg-green-900 border border-green-700 text-green-100 px-6 py-4 rounded-lg inline-block">
              <p className="font-medium">Answer submitted!</p>
              <p className="text-sm">Waiting for other players...</p>
            </div>
          ) : (
            <Button
              onClick={onSubmitAnswer}
              disabled={!selectedOption || timeRemaining <= 0}
              size="lg"
              className="px-12"
            >
              {selectedOption ? `Confirm Answer ${selectedOption}` : 'Select an Answer'}
            </Button>
          )}
        </div>

        {/* Selection status */}
        {selectedOption && !answerLocked && (
          <div className="text-center mt-4">
            <p className="text-gray-400">
              Selected: <span className="text-blue-400 font-medium">{selectedOption} - {question.options[selectedOption]}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};