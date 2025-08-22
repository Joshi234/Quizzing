import React from 'react';
import type { AnswerResultMessage, QuestionMessage } from '../types/game';

interface RevealScreenProps {
  question: QuestionMessage;
  result: AnswerResultMessage;
  selectedOption?: 'A' | 'B' | 'C' | 'D';
}

export const RevealScreen: React.FC<RevealScreenProps> = ({
  question,
  result,
  selectedOption,
}) => {
  const options: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

  const getOptionStyle = (option: 'A' | 'B' | 'C' | 'D') => {
    const isCorrect = option === result.correct;
    const isSelected = option === selectedOption;
    
    if (isCorrect) {
      return 'bg-green-700 border-green-500 text-white';
    }
    
    if (isSelected && !isCorrect) {
      return 'bg-red-700 border-red-500 text-white';
    }
    
    return 'bg-gray-800 border-gray-600 text-gray-300';
  };

  const getOptionIcon = (option: 'A' | 'B' | 'C' | 'D') => {
    const isCorrect = option === result.correct;
    const isSelected = option === selectedOption;
    
    if (isCorrect) {
      return (
        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    
    if (isSelected && !isCorrect) {
      return (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Results</h1>
          
          {/* Result Summary */}
          <div className={`inline-block px-8 py-4 rounded-lg ${
            result.youCorrect ? 'bg-green-900 border border-green-700' : 'bg-red-900 border border-red-700'
          }`}>
            <div className="flex items-center justify-center space-x-3">
              {result.youCorrect ? (
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <div>
                <p className={`text-xl font-bold ${result.youCorrect ? 'text-green-100' : 'text-red-100'}`}>
                  {result.youCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                <p className={`text-sm ${result.youCorrect ? 'text-green-300' : 'text-red-300'}`}>
                  +{result.yourPointsThisQ} points
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white leading-relaxed">
            {question.text}
          </h2>
        </div>

        {/* Options with Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {options.map((option) => (
            <div
              key={option}
              className={`p-6 rounded-lg border-2 ${getOptionStyle(option)}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  option === result.correct
                    ? 'bg-green-500 text-white'
                    : option === selectedOption
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {option}
                </div>
                <div className="flex-1">
                  <p className="text-lg">{question.options[option]}</p>
                </div>
                <div className="flex-shrink-0">
                  {getOptionIcon(option)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Answer Summary */}
        <div className="text-center bg-gray-800 rounded-lg p-6">
          <p className="text-gray-300 mb-2">
            The correct answer was: <span className="text-green-400 font-bold">{result.correct}</span>
          </p>
          {selectedOption && (
            <p className="text-gray-400">
              Your answer: <span className={`font-medium ${result.youCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {selectedOption}
              </span>
            </p>
          )}
          {!selectedOption && (
            <p className="text-gray-400">You did not answer this question</p>
          )}
        </div>
      </div>
    </div>
  );
};