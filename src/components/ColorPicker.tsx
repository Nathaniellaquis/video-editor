'use client';

import { useState, useEffect } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { Palette } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  const handleColorChange = (colorResult: ColorResult) => {
    onChange(colorResult.hex);
    setInputValue(colorResult.hex);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow typing hex values
    if (!value.startsWith('#') && value.length > 0) {
      value = '#' + value;
    }
    
    // Remove any non-hex characters except #
    value = value.slice(0, 1) + value.slice(1).replace(/[^0-9A-Fa-f]/g, '');
    
    // Limit to 7 characters total (#RRGGBB)
    value = value.slice(0, 7);
    
    // Update local state
    setInputValue(value);
    
    // Only call onChange if it's a valid complete hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-12 h-12 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors"
            style={{ backgroundColor: color }}
          >
            <Palette className="w-6 h-6 text-white drop-shadow" />
          </button>
          
          {isOpen && (
            <div className="absolute z-10 mt-2">
              <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
              <ChromePicker
                color={color}
                onChange={handleColorChange}
                disableAlpha
              />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleHexInputChange}
            placeholder="#000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            maxLength={7}
            autoComplete="off"
            data-form-type="other"
          />
        </div>
      </div>
    </div>
  );
} 