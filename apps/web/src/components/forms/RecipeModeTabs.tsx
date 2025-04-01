import React from "react";
import {
  UseFormReturn,
  ControllerRenderProps,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
} from "react-hook-form";
import { FormValues } from "@/lib/recipe-form-schema";
import { RecipeMode } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, PlusCircle } from "lucide-react";

interface RecipeModesTabsProps {
  form: UseFormReturn<FormValues>;
  fields: FieldArrayWithId<FormValues, "advancedSteps", "id">[];
  append: UseFieldArrayAppend<FormValues, "advancedSteps">;
  remove: UseFieldArrayRemove;
  advancedSteps: FormValues["advancedSteps"];
  totalWater: number;
  advancedTotalWater: number;
  waterDifference: number;
}

export const RecipeModeTabs: React.FC<RecipeModesTabsProps> = ({
  form,
  fields,
  append,
  remove,
  advancedSteps,
  totalWater,
  advancedTotalWater,
  waterDifference,
}) => {
  const { control, watch, register } = form;
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <FormLabel>Pouring Steps Definition</FormLabel>
      <FormField
        control={control}
        name="mode"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Tabs
                value={field.value}
                onValueChange={(value) => field.onChange(value as RecipeMode)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Mode</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Mode</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="pours"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, "pours">;
                      }) => (
                        <FormItem>
                          <FormLabel>Number of Pours</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="bloomMultiplier"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<
                          FormValues,
                          "bloomMultiplier"
                        >;
                      }) => (
                        <FormItem>
                          <FormLabel>Bloom Multiplier</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={control}
                    name="totalBrewTime"
                    render={({
                      field,
                    }: {
                      field: ControllerRenderProps<FormValues, "totalBrewTime">;
                    }) => (
                      <FormItem>
                        <FormLabel>Total Brew Time (mm:ss)</FormLabel>
                        <FormControl>
                          <Input placeholder="2:30" {...field} />
                        </FormControl>
                        <FormDescription>
                          Total brewing time from start to finish
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="rounded-md border p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-medium">Custom Pour Steps</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          append({
                            waterAmount: 70,
                            duration: 30,
                            isBloom: false,
                          })
                        }
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Step
                      </Button>
                    </div>

                    <div className="text-sm text-slate-500 mb-4">
                      Define your custom pour steps with specific water amounts
                      and durations. The first step is automatically set as the
                      bloom.
                    </div>

                    <div className="space-y-4">
                      {fields.map((field, index) => {
                        // Set the first field as bloom by default
                        const isBloom = watch(`advancedSteps.${index}.isBloom`);

                        // Determine if this is the last pour step
                        const isLastPour = index === fields.length - 1;

                        // Calculate accumulated water and time up to this step
                        const prevSteps = advancedSteps?.slice(0, index) || [];
                        const accumulatedWater = prevSteps.reduce(
                          (sum, step) => sum + (step?.waterAmount || 0),
                          0,
                        );
                        const accumulatedTime = prevSteps.reduce(
                          (sum, step) => sum + (step?.duration || 0),
                          0,
                        );

                        // Current step water
                        const currentStepWater =
                          watch(`advancedSteps.${index}.waterAmount`) || 0;

                        // Total accumulated water including current step
                        const totalAccumulatedWater =
                          accumulatedWater + currentStepWater;

                        return (
                          <div
                            key={field.id}
                            className="space-y-4 p-4 border rounded-md my-2 bg-gray-50 dark:bg-gray-900"
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="text-md font-medium">
                                {isBloom
                                  ? "Bloom Step"
                                  : `Pour Step ${index === 0 ? "1" : index}`}
                              </h3>

                              {index > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <FormLabel className="text-xs">
                                  Water Amount (g)
                                </FormLabel>
                                <Input
                                  type="number"
                                  min="1"
                                  {...register(
                                    `advancedSteps.${index}.waterAmount` as const,
                                    { valueAsNumber: true },
                                  )}
                                  className="h-9"
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                  Total after step: {totalAccumulatedWater}g
                                </div>
                              </div>

                              <div>
                                <FormLabel className="text-xs">
                                  Duration (sec)
                                </FormLabel>
                                <Input
                                  type="number"
                                  min="1"
                                  {...register(
                                    `advancedSteps.${index}.duration` as const,
                                    { valueAsNumber: true },
                                  )}
                                  className="h-9"
                                />
                                <div className="text-xs text-muted-foreground mt-1">
                                  Time at start: {formatTime(accumulatedTime)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`advancedSteps.${index}.isBloom`}
                                className="h-4 w-4 rounded border-gray-300"
                                {...register(
                                  `advancedSteps.${index}.isBloom` as const,
                                )}
                              />
                              <label
                                htmlFor={`advancedSteps.${index}.isBloom`}
                                className="text-sm font-medium"
                              >
                                Bloom Step
                              </label>
                            </div>

                            <div>
                              <FormLabel className="text-xs">
                                Description (optional)
                              </FormLabel>
                              <Textarea
                                placeholder="Add notes or details about this step..."
                                className="resize-none h-20 text-sm"
                                {...register(
                                  `advancedSteps.${index}.description` as const,
                                )}
                              />
                            </div>

                            {isLastPour && !isBloom && (
                              <div className="text-xs text-amber-600 mt-2">
                                Note: This is the last pour step. Duration here
                                represents only the pouring time, not including
                                any drawdown time.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Water total validation */}
                    <div className="mt-4 p-3 rounded-md bg-slate-100 dark:bg-slate-800">
                      <div className="text-sm font-medium mb-2">
                        Water Amount Summary
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Recipe Water Target:</div>
                        <div className="text-right">{totalWater}g</div>

                        <div>Current Steps Total:</div>
                        <div className="text-right">{advancedTotalWater}g</div>

                        <div className="font-medium">Difference:</div>
                        <div
                          className={`text-right font-medium ${waterDifference > 0 ? "text-orange-600" : waterDifference < 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {waterDifference > 0
                            ? `${waterDifference}g needed`
                            : waterDifference < 0
                              ? `${Math.abs(waterDifference)}g too much`
                              : "Perfect match"}
                        </div>
                      </div>

                      {waterDifference !== 0 && (
                        <div className="mt-2 text-xs">
                          {waterDifference > 0
                            ? `You need to add ${waterDifference}g more water to your steps to match the recipe target.`
                            : `Your steps have ${Math.abs(waterDifference)}g more water than the recipe target.`}
                        </div>
                      )}
                    </div>

                    {/* Drawdown toggle */}
                    <div className="mt-4">
                      <FormField
                        control={control}
                        name="includeDrawdown"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md bg-slate-100 dark:bg-slate-800">
                            <FormControl>
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel>Include Drawdown Step</FormLabel>
                              <FormDescription>
                                Add a final drawdown step after the last pour.
                                This step has no water amount.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
