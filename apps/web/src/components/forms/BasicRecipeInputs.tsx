import React from "react";
import { UseFormReturn, ControllerRenderProps } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FormValues } from "@/lib/recipe-form-schema";
import { InputMode } from "@/types/recipe";

interface BasicRecipeInputsProps {
  form: UseFormReturn<FormValues>;
  inputMode: string;
  calculatedCoffeeWeight: number;
  calculatedWaterWeight: number;
}

export const BasicRecipeInputs: React.FC<BasicRecipeInputsProps> = ({
  form,
  inputMode,
  calculatedCoffeeWeight,
  calculatedWaterWeight,
}) => {
  const { control, setValue, watch } = form;
  const coffeeWeight = watch("coffeeWeight");
  const waterWeight = watch("waterWeight");
  const ratio = watch("ratio");
  const temperatureUnit = watch("temperatureUnit");

  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({
          field,
        }: {
          field: ControllerRenderProps<FormValues, "name">;
        }) => (
          <FormItem>
            <FormLabel>Recipe Name</FormLabel>
            <FormControl>
              <Input placeholder="My Custom Recipe" {...field} />
            </FormControl>
            <FormDescription>Give your recipe a unique name</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Input Mode Toggle */}
      <div className="space-y-2">
        <FormLabel>Define Recipe By</FormLabel>
        <FormField
          control={control}
          name="inputMode"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={(value) => {
                    if (value) {
                      // Update input mode
                      const newMode = value as InputMode;

                      if (newMode === "coffee") {
                        // When switching to coffee mode, calculate coffee weight from water if needed
                        if (!coffeeWeight && waterWeight) {
                          const calculatedCoffee = Math.round(
                            waterWeight / ratio,
                          );
                          setValue("coffeeWeight", calculatedCoffee);
                        }
                      } else {
                        // When switching to water mode, calculate water weight from coffee if needed
                        if (!waterWeight && coffeeWeight) {
                          const calculatedWater = coffeeWeight * ratio;
                          setValue("waterWeight", calculatedWater);
                        }
                      }

                      field.onChange(newMode);
                    }
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="coffee">
                    Coffee Weight
                  </ToggleGroupItem>
                  <ToggleGroupItem value="water">Total Water</ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {inputMode === "coffee" ? (
          <FormField
            control={control}
            name="coffeeWeight"
            render={({
              field,
            }: {
              field: ControllerRenderProps<FormValues, "coffeeWeight">;
            }) => (
              <FormItem>
                <FormLabel>Coffee Weight (g)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={control}
            name="waterWeight"
            render={({
              field,
            }: {
              field: ControllerRenderProps<FormValues, "waterWeight">;
            }) => (
              <FormItem>
                <FormLabel>Total Water (g)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={control}
          name="ratio"
          render={({
            field,
          }: {
            field: ControllerRenderProps<FormValues, "ratio">;
          }) => (
            <FormItem>
              <FormLabel>Water-to-Coffee Ratio</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Water Temperature Input */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="waterTemperature"
          render={({
            field,
          }: {
            field: ControllerRenderProps<FormValues, "waterTemperature">;
          }) => (
            <FormItem>
              <FormLabel>Water Temperature</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>
                {temperatureUnit === "C"
                  ? "Recommended brewing temperature: 88-96°C"
                  : "Recommended brewing temperature: 190-205°F"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="temperatureUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="C">Celsius (°C)</SelectItem>
                  <SelectItem value="F">Fahrenheit (°F)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Display calculated values */}
      {inputMode === "coffee" && (
        <div className="rounded-md border p-3 bg-slate-50 dark:bg-slate-900">
          <div className="text-sm font-medium">
            Total Water:{" "}
            <span className="font-bold">{calculatedWaterWeight}g</span>
          </div>
        </div>
      )}

      {inputMode === "water" && (
        <div className="rounded-md border p-3 bg-slate-50 dark:bg-slate-900">
          <div className="text-sm font-medium">
            Coffee Weight:{" "}
            <span className="font-bold">{calculatedCoffeeWeight}g</span>
          </div>
        </div>
      )}
    </>
  );
};
