"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Recipe, Step } from "../types/recipe";
import {
  formatTime,
  calculateRecipeWithCustomWater,
  predefinedRecipes,
} from "../lib/recipe-utils";
import { Timer } from "./ui/timer";
import { StepDisplay } from "./ui/step-display";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { debounce } from "lodash";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface BrewingTimerProps {
  recipeId: string;
}

export const BrewingTimer = ({ recipeId }: BrewingTimerProps) => {
  const router = useRouter();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [originalRecipe, setOriginalRecipe] = useState<Recipe | null>(null);
  const [currentTimeInSeconds, setCurrentTimeInSeconds] = useState<number>(0);
  const [totalWaterPoured, setTotalWaterPoured] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [cumulativeStepTarget, setCumulativeStepTarget] = useState<number>(0);
  const [, setWaterForCurrentStep] = useState<number>(0);
  const [nextStepTime, setNextStepTime] = useState<string>("");
  const [customWaterWeight, setCustomWaterWeight] = useState<number>(0);
  const [customCoffeeWeight, setCustomCoffeeWeight] = useState<number>(0);
  const [weightInputMode, setWeightInputMode] = useState<"water" | "coffee">("water");
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load the recipe from recipeId on component mount
  useEffect(() => {
    // First, find recipe by ID from predefined recipes
    let recipe = predefinedRecipes.find((r) => r.id === recipeId);

    // If not found in predefined recipes, try to find in custom recipes from localStorage
    if (!recipe && typeof window !== "undefined") {
      const customRecipesStr = localStorage.getItem("customRecipes");
      if (customRecipesStr) {
        try {
          const customRecipes = JSON.parse(customRecipesStr);
          recipe = customRecipes.find((r: Recipe) => r.id === recipeId);
        } catch (error) {
          console.error("Error parsing custom recipes:", error);
        }
      }
    }

    if (recipe) {
      setOriginalRecipe(recipe);
      setSelectedRecipe(recipe);
      setCurrentTimeInSeconds(0);
      setTotalWaterPoured(0);
      const firstStep = recipe.steps[0];
      if (firstStep) {
        setCumulativeStepTarget(firstStep.targetWeight);
        setCurrentStep(firstStep);
      }
      setWaterForCurrentStep(0);
      setCustomWaterWeight(recipe.waterWeight);
      setCustomCoffeeWeight(recipe.coffeeWeight);

      if (recipe.steps.length > 1) {
        const secondStep = recipe.steps[1];
        if (secondStep) {
          setNextStepTime(secondStep.targetTime);
        }
      }
    } else {
      // If not found in predefined or custom recipes, redirect
      router.push("/pour-over");
    }

    setIsLoading(false);
  }, [recipeId, router]);

  // Get the current step based on timer
  useEffect(() => {
    if (!selectedRecipe) return;

    const steps = selectedRecipe.steps;
    let foundCurrentStep = false;
    let currentStepIndex = 0;

    // Find the current step based on time
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStepTime = steps[i]?.targetTimeInSeconds ?? 0;
      const nextStepTime = steps[i + 1]?.targetTimeInSeconds ?? 0;

      if (
        currentTimeInSeconds >= currentStepTime &&
        currentTimeInSeconds < nextStepTime
      ) {
        const step = steps[i];
        if (step) {
          setCurrentStep(step);
        }
        currentStepIndex = i;
        foundCurrentStep = true;
        // Set the next step time
        const nextStep = steps[i + 1];
        if (nextStep) {
          setNextStepTime(nextStep.targetTime);
        }
        break;
      }
    }

    // If we're in the last step or beyond
    if (!foundCurrentStep && steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      if (lastStep && currentTimeInSeconds >= lastStep.targetTimeInSeconds) {
        setCurrentStep(lastStep);
        currentStepIndex = steps.length - 1;
        // For the last step, show expected finish time
        setNextStepTime(formatTime(lastStep.targetTimeInSeconds + 60)); // Typically drawdown ends ~60s after start
      } else {
        const firstStep = steps[0];
        if (firstStep) {
          setCurrentStep(firstStep);
        }
        currentStepIndex = 0;
        if (steps.length > 1) {
          const secondStep = steps[1];
          if (secondStep) {
            setNextStepTime(secondStep.targetTime);
          }
        }
      }
    }

    // Calculate cumulative target water based on current step index
    let calculatedCumulativeTarget = 0;
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = steps[i];
      if (step && step.type !== "drawdown") {
        calculatedCumulativeTarget += step.targetWeight;
      }
    }
    setCumulativeStepTarget(calculatedCumulativeTarget);

    // Calculate total water poured based on completed steps
    let calculatedWaterPoured = 0;
    let waterInCurrentStep = 0;

    // Add water from completed steps (all steps before the current one)
    for (let i = 0; i < currentStepIndex; i++) {
      const step = steps[i];
      if (step && step.type !== "drawdown") {
        calculatedWaterPoured += step.targetWeight;
      }
    }

    // Add water from current step if not drawdown
    if (currentStep && currentStep.type !== "drawdown") {
      if (currentTimeInSeconds >= currentStep.targetTimeInSeconds + 10) {
        // If we're more than 10 seconds into the current step, assume all water is poured for calculation
        waterInCurrentStep = currentStep.targetWeight;
        calculatedWaterPoured += waterInCurrentStep;
      } else if (currentTimeInSeconds > currentStep.targetTimeInSeconds) {
        // If we're just starting the step, calculate partial water based on time elapsed
        const stepProgress = Math.min(
          1,
          (currentTimeInSeconds - currentStep.targetTimeInSeconds) / 10,
        );
        waterInCurrentStep = Math.round(
          currentStep.targetWeight * stepProgress,
        );
        calculatedWaterPoured += waterInCurrentStep;
      }

      setWaterForCurrentStep(waterInCurrentStep);
    } else {
      // For drawdown step, keep cumulative target as is, but don't add current water
      setWaterForCurrentStep(0);
    }

    setTotalWaterPoured(calculatedWaterPoured);
  }, [currentTimeInSeconds, selectedRecipe, currentStep]);

  // Handle timer updates
  const handleTimeUpdate = (timeInSeconds: number) => {
    setCurrentTimeInSeconds(timeInSeconds);
    if (timeInSeconds > 0) {
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  };

  // Create debounced version of applyCustomWater
  const debouncedApplyCustomWater = debounce((weight: number) => {
    if (weight >= 100 && originalRecipe) {
      const customizedRecipe = calculateRecipeWithCustomWater(originalRecipe, {
        waterWeight: weight,
      });
      setSelectedRecipe(customizedRecipe);
      setCustomCoffeeWeight(customizedRecipe.coffeeWeight);
    }
  }, 500);

  // Create debounced version of applyCustomCoffee
  const debouncedApplyCustomCoffee = debounce((coffeeWeight: number) => {
    if (coffeeWeight > 0 && originalRecipe && originalRecipe.ratio) {
      const calculatedWaterWeight = coffeeWeight * originalRecipe.ratio;
      setCustomWaterWeight(calculatedWaterWeight);
      
      const customizedRecipe = calculateRecipeWithCustomWater(originalRecipe, {
        waterWeight: calculatedWaterWeight,
      });
      setSelectedRecipe(customizedRecipe);
    }
  }, 500);

  // Handle water weight input change with debounce
  const handleCustomWaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setCustomWaterWeight(isNaN(value) ? 0 : value);
    
    if (!isNaN(value) && value >= 100) {
      debouncedApplyCustomWater(value);
      
      // Update coffee weight based on ratio
      if (originalRecipe && originalRecipe.ratio) {
        const calculatedCoffee = Math.round(value / originalRecipe.ratio);
        setCustomCoffeeWeight(calculatedCoffee);
      }
    }
  };

  // Handle coffee weight input change
  const handleCustomCoffeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setCustomCoffeeWeight(isNaN(value) ? 0 : value);
    
    if (!isNaN(value) && value > 0) {
      debouncedApplyCustomCoffee(value);
    }
  };

  // Get water status display values
  const getWaterStatus = () => {
    if (!currentStep) return { targetAmount: 0, progressPercent: 0 };

    if (currentStep.type === "drawdown") {
      // For drawdown step, show total water and recipe total
      return {
        targetAmount: selectedRecipe?.waterWeight || 0,
        progressPercent: Math.round(
          (totalWaterPoured / (selectedRecipe?.waterWeight || 1)) * 100,
        ),
      };
    } else {
      // For active steps, show cumulative step target
      return {
        targetAmount: cumulativeStepTarget,
        progressPercent: Math.round(
          (totalWaterPoured / (cumulativeStepTarget || 1)) * 100,
        ),
      };
    }
  };

  const waterStatus = getWaterStatus();

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="flex justify-center">
      {selectedRecipe && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{selectedRecipe.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Tabs value={weightInputMode} onValueChange={(v) => setWeightInputMode(v as "water" | "coffee")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="water" disabled={isTimerActive}>Water Weight</TabsTrigger>
                  <TabsTrigger value="coffee" disabled={isTimerActive}>Coffee Weight</TabsTrigger>
                </TabsList>
                
                <TabsContent value="water" className="mt-0">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="waterWeightBrewing" className="min-w-[128px]">Total Water Weight:</Label>
                    <Input
                      id="waterWeightBrewing"
                      type="number"
                      value={customWaterWeight}
                      onChange={handleCustomWaterChange}
                      min={100}
                      className="w-24"
                      disabled={isTimerActive}
                    />
                    <span>g</span>
                  </div>
                </TabsContent>
                
                <TabsContent value="coffee" className="mt-0">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="coffeeWeightBrewing" className="min-w-[128px]">Coffee Weight:</Label>
                    <Input
                      id="coffeeWeightBrewing"
                      type="number"
                      value={customCoffeeWeight}
                      onChange={handleCustomCoffeeChange}
                      min={5}
                      className="w-24"
                      disabled={isTimerActive}
                    />
                    <span>g</span>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="text-sm text-gray-500 flex justify-between px-2">
                <span>Ratio: 1:{selectedRecipe.ratio}</span>
                <span>
                  {customCoffeeWeight}g coffee : {customWaterWeight}g water
                </span>
              </div>

              <Timer
                initialTimeInSeconds={0}
                targetTime={nextStepTime}
                onTimeUpdate={handleTimeUpdate}
              />

              <div className="bg-gray-50 dark:bg-gray-800 rounded-md px-2 py-3">
                <div className="flex justify-around">
                  <div>
                    <span className="text-sm text-gray-500">Step Target</span>
                    <div className="text-xl font-bold">
                      {waterStatus.targetAmount}g
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {currentStep && (
              <StepDisplay
                step={currentStep}
                currentTimeInSeconds={currentTimeInSeconds}
                totalWaterPoured={totalWaterPoured}
              />
            )}

            <div className="text-sm space-y-2">
              <div className="font-medium">Upcoming Steps:</div>
              <div className="space-y-1">
                {selectedRecipe.steps
                  .filter(
                    (step) => step.targetTimeInSeconds > currentTimeInSeconds,
                  )
                  .slice(0, 4)
                  .map((step) => (
                    <div
                      key={step.id}
                      className="flex justify-between text-gray-600"
                    >
                      <span className="capitalize">
                        {step.type} ({step.targetWeight}g)
                      </span>
                      <span>{step.targetTime}</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
