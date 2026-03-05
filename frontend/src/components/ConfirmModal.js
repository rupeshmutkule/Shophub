import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, success, warning, info
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch(type) {
      case 'danger':
        return {
          bg: 'from-red-500 to-red-600',
          hover: 'hover:from-red-600 hover:to-red-700',
          icon: '⚠️',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'success':
        return {
          bg: 'from-green-500 to-green-600',
          hover: 'hover:from-green-600 hover:to-green-700',
          icon: '✓',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'warning':
        return {
          bg: 'from-yellow-500 to-orange-500',
          hover: 'hover:from-yellow-600 hover:to-orange-600',
          icon: '⚠️',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600'
        };
      case 'info':
        return {
          bg: 'from-indigo-600 to-purple-600',
          hover: 'hover:from-indigo-700 hover:to-purple-700',
          icon: 'ℹ️',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600'
        };
      default:
        return {
          bg: 'from-indigo-600 to-purple-600',
          hover: 'hover:from-indigo-700 hover:to-purple-700',
          icon: 'ℹ️',
          iconBg: 'bg-indigo-100',
          iconColor: 'text-indigo-600'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className={`w-20 h-20 ${colors.iconBg} rounded-full flex items-center justify-center shadow-lg`}>
            <span className="text-4xl">{colors.icon}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
          <p className="text-gray-600 text-base leading-relaxed">{message}</p>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-6 py-3 bg-gradient-to-r ${colors.bg} ${colors.hover} text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
