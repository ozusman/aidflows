import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useCaregivers, Caregiver } from '@/hooks/useCaregivers';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CaregiverAutocompleteProps {
  value: string;
  onChange: (value: string, caregiverType?: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function CaregiverAutocomplete({
  value,
  onChange,
  placeholder,
  required,
}: CaregiverAutocompleteProps) {
  const { t } = useI18n();
  const { caregivers } = useCaregivers();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync inputValue with value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter caregivers based on input
  const filteredCaregivers = caregivers.filter((caregiver) =>
    caregiver.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelect = (caregiver: Caregiver) => {
    setInputValue(caregiver.name);
    onChange(caregiver.name, caregiver.caregiver_type);
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (caregivers.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      
      {isOpen && filteredCaregivers.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredCaregivers.map((caregiver) => (
            <button
              key={caregiver.id}
              type="button"
              onClick={() => handleSelect(caregiver)}
              className={cn(
                "w-full px-3 py-2 text-start text-sm hover:bg-hover-light focus:bg-hover-light focus:outline-none transition-colors",
                caregiver.name === inputValue && "bg-hover-light"
              )}
            >
              {caregiver.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}