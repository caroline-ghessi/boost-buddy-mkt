import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const presets = [
    {
      label: "Hoje",
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      label: "Últimos 7 dias",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return { from: start, to: end };
      },
    },
    {
      label: "Últimos 30 dias",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { from: start, to: end };
      },
    },
    {
      label: "Últimos 90 dias",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 90);
        return { from: start, to: end };
      },
    },
    {
      label: "Últimos 6 meses",
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - 6);
        return { from: start, to: end };
      },
    },
  ];

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex">
            <div className="flex flex-col gap-2 p-3 border-r">
              <div className="text-sm font-semibold mb-2">Atalhos</div>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => onDateRangeChange(preset.getValue())}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
