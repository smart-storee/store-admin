import { ChangeEvent } from 'react';

interface InputProps {
  label: string;
  id: string;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export const Input = ({ 
  label, 
  id, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  className = ''
}: InputProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`py-2 px-3 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            error ? 'border-red-300' : ''
          }`}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

interface SelectProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  className?: string;
}

export const Select = ({ 
  label, 
  id, 
  value, 
  onChange, 
  options, 
  error, 
  required = false,
  className = ''
}: SelectProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required={required}
          className={`block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            error ? 'border-red-300' : ''
          }`}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};

interface TextareaProps {
  label: string;
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  rows?: number;
  className?: string;
}

export const Textarea = ({ 
  label, 
  id, 
  value, 
  onChange, 
  placeholder, 
  error, 
  required = false,
  rows = 3,
  className = ''
}: TextareaProps) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`py-2 px-3 block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            error ? 'border-red-300' : ''
          }`}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
};