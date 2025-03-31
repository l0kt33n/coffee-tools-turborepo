"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";

import {
  createCustomRecipe,
  formatTime,
  parseTimeToSeconds,
} from "@/lib/recipe-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Recipe, Step } from "@/types/recipe";
import { Form } from "@/components/ui/form";
import { BasicRecipeInputs } from "@/components/forms/BasicRecipeInputs";
import { RecipeModeTabs } from "@/components/forms/RecipeModeTabs";
import { RecipeSummary } from "@/components/forms/RecipeSummary";
import { recipeFormSchema, FormValues } from "@/lib/recipe-form-schema";

export default function CustomRecipePage() {
  const router = useRouter();
  const [calculatedCoffeeWeight, setCalculatedCoffeeWeight] = useState<number>(0);
  const [calculatedWaterWeight, setCalculatedWaterWeight] = useState<number>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: "My Custom Recipe",
      coffeeWeight: 20,
      waterWeight: 320,
      ratio: 16,
      pours: 4,
      bloomMultiplier: 3,
      totalBrewTime: "2:30",
      inputMode: "coffee",
      mode: "basic",
      advancedSteps: [
        { waterAmount: 60, duration: 45, isBloom: true },
        { waterAmount: 70, duration: 30, isBloom: false },
        { waterAmount: 70, duration: 30, isBloom: false },
        { waterAmount: 70, duration: 30, isBloom: false },
      ],
      waterTemperature: 95,
      temperatureUnit: "C",
      includeDrawdown: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "advancedSteps",
  });

  const { watch, setValue } = form;
  const coffeeWeight = watch("coffeeWeight");
  const waterWeight = watch("waterWeight");
  const ratio = watch("ratio");
  const pours = watch("pours");
  const bloomMultiplier = watch("bloomMultiplier");
  const inputMode = watch("inputMode");
  const mode = watch("mode");
  const advancedSteps = watch("advancedSteps");
  const waterTemperature = watch("waterTemperature");
  const temperatureUnit = watch("temperatureUnit");

  // Calculate the dependent values based on the input mode
  useEffect(() => {
    if (inputMode === "coffee" && coffeeWeight) {
      // When coffee weight changes, update the water weight
      const newWaterWeight = coffeeWeight * ratio;
      setCalculatedWaterWeight(newWaterWeight);
    } else if (inputMode === "water" && waterWeight) {
      // When water weight changes, update the coffee weight
      const newCoffeeWeight = Math.round(waterWeight / ratio);
      setCalculatedCoffeeWeight(newCoffeeWeight);
    }
  }, [inputMode, coffeeWeight, waterWeight, ratio]);

  // Set initial values when changing input mode
  useEffect(() => {
    if (inputMode === "coffee") {
      if (coffeeWeight) {
        setCalculatedWaterWeight(coffeeWeight * ratio);
      }
      // Clear water weight field when switching to coffee mode
      setValue("waterWeight", undefined);
    } else {
      if (waterWeight) {
        setCalculatedCoffeeWeight(Math.round(waterWeight / ratio));
      } else {
        // Initialize water weight when switching to water mode
        const initialWaterWeight = (coffeeWeight || 20) * ratio;
        setValue("waterWeight", initialWaterWeight);
        setCalculatedCoffeeWeight(Math.round(initialWaterWeight / ratio));
      }
      // Clear coffee weight field when switching to water mode
      setValue("coffeeWeight", undefined);
    }
  }, [inputMode, setValue, coffeeWeight, waterWeight, ratio]);

  // Update advanced steps when values change in basic mode
  useEffect(() => {
    // Only update if in basic mode
    if (mode !== "basic") return;

    // Calculate standard pour sizes for advanced mode
    const currentCoffeeWeight =
      inputMode === "coffee"
        ? coffeeWeight || 20
        : calculatedCoffeeWeight || 20;

    const currentWaterWeight =
      inputMode === "coffee"
        ? calculatedWaterWeight || currentCoffeeWeight * ratio
        : waterWeight || 320;

    const newBloomWater = Math.round(currentCoffeeWeight * bloomMultiplier);
    const remainingWater = currentWaterWeight - newBloomWater;
    const waterPerPour = pours > 0 ? Math.round(remainingWater / pours) : 0;

    // Create new advanced steps based on the current pour settings
    const newAdvancedSteps = [
      { waterAmount: newBloomWater, duration: 45, isBloom: true },
    ];

    for (let i = 0; i < pours; i++) {
      newAdvancedSteps.push({
        waterAmount: waterPerPour,
        duration: 30,
        isBloom: false,
      });
    }

    setValue("advancedSteps", newAdvancedSteps);
  }, [
    pours,
    bloomMultiplier,
    calculatedCoffeeWeight,
    calculatedWaterWeight,
    waterWeight,
    coffeeWeight,
    inputMode,
    mode,
    setValue,
    ratio,
  ]);

  // Derived calculations for display
  const totalCoffee =
    inputMode === "coffee" ? coffeeWeight || 20 : calculatedCoffeeWeight || 20;

  const totalWater =
    inputMode === "coffee"
      ? calculatedWaterWeight || totalCoffee * ratio
      : waterWeight || 320;

  const bloomWater = Math.round(totalCoffee * bloomMultiplier);
  const remainingWater = totalWater - bloomWater;
  const waterPerPour = pours > 0 ? Math.round(remainingWater / pours) : 0;

  // Watch for changes in advanced steps to update water total calculation
  const advancedTotalWater =
    watch("advancedSteps")?.reduce(
      (total: number, step: { waterAmount?: number }) => total + (step?.waterAmount || 0),
      0,
    ) || 0;

  // Calculate the water difference based on the current total water
  const waterDifference = totalWater - advancedTotalWater;

  function onSubmit(values: FormValues) {
    // Convert totalBrewTime from mm:ss format to seconds
    const totalBrewTimeSeconds = parseTimeToSeconds(values.totalBrewTime);

    // Prepare advanced steps if in advanced mode
    let advancedStepsForRecipe: Step[] = [];

    if (values.mode === "advanced" && values.advancedSteps) {
      let currentTime = 0;
      let cumulativeWater = 0;

      advancedStepsForRecipe = values.advancedSteps.map((step, index) => {
        const stepTime = currentTime;
        currentTime += step.duration;
        cumulativeWater += step.waterAmount;

        return {
          id: `step-${index}`,
          type: step.isBloom ? "bloom" : "pour",
          targetTime: formatTime(stepTime),
          targetTimeInSeconds: stepTime,
          targetWeight: step.waterAmount,
          targetRatio: step.isBloom
            ? step.waterAmount / totalCoffee
            : step.waterAmount / totalWater,
          instruction: step.isBloom
            ? `Pour ${step.waterAmount}g of water to bloom the coffee grounds`
            : `Pour ${step.waterAmount}g of water in a circular motion (total: ${cumulativeWater}g)`,
          description: step.description || undefined,
        };
      });

      // Add a drawdown step if enabled
      if (values.includeDrawdown) {
        advancedStepsForRecipe.push({
          id: `step-${advancedStepsForRecipe.length}`,
          type: "drawdown",
          targetTime: formatTime(currentTime),
          targetTimeInSeconds: currentTime,
          targetWeight: 0,
          targetRatio: 0,
          instruction: "Allow remaining water to drain through the coffee bed",
        });
      }
    }

    // Create the recipe using the utility function
    const recipe: Recipe = createCustomRecipe({
      coffeeWeight: totalCoffee,
      waterWeight: totalWater,
      ratio: values.ratio,
      pours: values.pours,
      bloomMultiplier: values.bloomMultiplier,
      mode: values.mode,
      inputMode: values.inputMode,
      totalBrewTimeSeconds,
      advancedSteps: advancedStepsForRecipe,
      waterTemperature: values.waterTemperature,
      temperatureUnit: values.temperatureUnit,
    });

    // Add the custom name to the recipe
    recipe.name = values.name;

    // Store the recipe in localStorage
    const existingRecipes = JSON.parse(
      localStorage.getItem("customRecipes") || "[]",
    );
    localStorage.setItem(
      "customRecipes",
      JSON.stringify([...existingRecipes, recipe]),
    );

    // Redirect to the brew page with the new recipe
    router.push(`/pour-over/brew/${recipe.id}`);
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create Custom Recipe</h1>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Recipe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <BasicRecipeInputs 
                form={form}
                inputMode={inputMode}
                calculatedCoffeeWeight={calculatedCoffeeWeight}
                calculatedWaterWeight={calculatedWaterWeight}
              />
              
              <RecipeModeTabs
                form={form}
                fields={fields}
                append={append}
                remove={remove}
                advancedSteps={advancedSteps}
                totalWater={totalWater}
                advancedTotalWater={advancedTotalWater}
                waterDifference={waterDifference}
              />

              <RecipeSummary
                mode={mode}
                totalCoffee={totalCoffee}
                totalWater={totalWater}
                ratio={ratio}
                waterTemperature={waterTemperature}
                temperatureUnit={temperatureUnit}
                advancedSteps={advancedSteps}
                bloomWater={bloomWater}
                waterPerPour={waterPerPour}
                pours={pours}
                formatTime={formatTime}
                watchIncludeDrawdown={() => watch("includeDrawdown")}
              />

              <Button type="submit" className="w-full">
                Create Recipe
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
