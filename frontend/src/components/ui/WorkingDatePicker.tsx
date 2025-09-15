import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import "react-datepicker/dist/react-datepicker.css";

interface WorkingDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export const WorkingDatePicker: React.FC<WorkingDatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedDate = value ? new Date(value) : null;
  
  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      onChange(dateString);
      setIsOpen(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground"
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        <span>{formatDisplayDate(value)}</span>
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={minDate}
            inline
            showPopperArrow={false}
            popperPlacement="bottom-start"

            calendarClassName="shadow-lg border border-gray-200 rounded-lg bg-white"
            dayClassName={(date) => {
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = value && date.toISOString().split('T')[0] === value;
              
              if (isSelected) return "bg-blue-600 text-white hover:bg-blue-700";
              if (isToday) return "bg-blue-100 text-blue-800";
              return "hover:bg-gray-100";
            }}
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <button
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-sm font-semibold">
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
          />
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
