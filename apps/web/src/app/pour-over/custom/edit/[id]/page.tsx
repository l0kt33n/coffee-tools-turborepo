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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const convertStepsToFormValues = (steps: Step[] | undefined | null) => {
  if (!steps) return [];
  const nonDrawdownSteps = steps.filter(step => step.type !== "drawdown");
  
  return nonDrawdownSteps.map((step, index) => {
    // Calculate duration differently for bloom vs pour steps
    let duration = 0;
    
    if (step.type === "bloom") {
      // For bloom steps, calculate duration based on the next step's time
      if (index + 1 < nonDrawdownSteps.length) {
        const nextStep = nonDrawdownSteps[index + 1];
        if (nextStep && nextStep.targetTimeInSeconds !== undefined) {
          duration = nextStep.targetTimeInSeconds - step.targetTimeInSeconds;
        } else {
          duration = 45; // Default if next step is missing or has invalid time
        }
      } else {
        duration = 45; // Default for the last step or only step
      }
    } else {
      // For pour steps, calculate based on previous step's time
      if (index > 0) {
        const prevStep = nonDrawdownSteps[index - 1];
        if (prevStep && prevStep.targetTimeInSeconds !== undefined) {
          duration = step.targetTimeInSeconds - prevStep.targetTimeInSeconds;
        } else {
          duration = 30; // Default if prev step is missing or has invalid time
        }
      } else {
        duration = 30; // Default for the first step
      }
    }
    
    return {
      waterAmount: step.targetWeight,
      duration,
      isBloom: step.type === "bloom",
      description: step.description
    };
  });
};

export default function EditRecipePage({ params }: PageProps) {
  const router = useRouter();
  const [calculatedCoffeeWeight, setCalculatedCoffeeWeight] = useState<number>(0);
  const [calculatedWaterWeight, setCalculatedWaterWeight] = useState<number>(0);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const { id } = React.use(params);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRecipes = localStorage.getItem("customRecipes");
      if (savedRecipes) {
        const recipes = JSON.parse(savedRecipes);
        const foundRecipe = recipes.find((r: Recipe) => r.id === id);
        if (foundRecipe) {
          setRecipe(foundRecipe);
        } else {
          router.push("/pour-over/custom/manage");
        }
      }
    }
  }, [id, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: recipe?.name || "",
      coffeeWeight: recipe?.coffeeWeight || 20,
      waterWeight: recipe?.waterWeight || 320,
      ratio: recipe?.ratio || 16,
      pours: recipe?.pours || 4,
      bloomMultiplier: recipe?.bloomMultiplier || 3,
      totalBrewTime: recipe?.totalBrewTime ? formatTime(recipe.totalBrewTime) : "2:30",
      inputMode: recipe?.inputMode || "coffee",
      mode: recipe?.mode || "basic",
      advancedSteps: recipe?.steps ? 
        convertStepsToFormValues(recipe.steps) : 
        [
          { waterAmount: 60, duration: 45, isBloom: true },
          { waterAmount: 70, duration: 30, isBloom: false },
          { waterAmount: 70, duration: 30, isBloom: false },
          { waterAmount: 70, duration: 30, isBloom: false },
        ],
      waterTemperature: recipe?.waterTemperature || 95,
      temperatureUnit: recipe?.temperatureUnit || "C",
      includeDrawdown: recipe?.steps ? 
        recipe.steps.some(step => step.type === "drawdown") : 
        true,
    }
  });

  useEffect(() => {
    if (recipe) {
      form.reset({
        name: recipe.name,
        coffeeWeight: recipe.coffeeWeight,
        waterWeight: recipe.waterWeight,
        ratio: recipe.ratio,
        pours: recipe.pours,
        bloomMultiplier: recipe.bloomMultiplier,
        totalBrewTime: formatTime(recipe.totalBrewTime),
        inputMode: recipe.inputMode || "coffee",
        mode: recipe.mode || "basic",
        advancedSteps: convertStepsToFormValues(recipe.steps),
        waterTemperature: recipe.waterTemperature || 95,
        temperatureUnit: recipe.temperatureUnit || "C",
        includeDrawdown: recipe.steps.some(step => step.type === "drawdown"),
      });
    }
  }, [recipe, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "advancedSteps",
  });

  const { watch, setValue } = form;
  const coffeeWeight = watch("coffeeWeight") || 0;
  const waterWeight = watch("waterWeight") || 0;
  const ratio = watch("ratio") || 16;
  const pours = watch("pours") || 4;
  const bloomMultiplier = watch("bloomMultiplier") || 3;
  const inputMode = watch("inputMode");
  const mode = watch("mode");
  const advancedSteps = watch("advancedSteps") || [];
  const waterTemperature = watch("waterTemperature");
  const temperatureUnit = watch("temperatureUnit");

  useEffect(() => {
    if (inputMode === "coffee") {
      const calculatedWater = coffeeWeight * ratio;
      setCalculatedWaterWeight(calculatedWater);
      setValue("waterWeight", calculatedWater);
    } else {
      const calculatedCoffee = Math.round(waterWeight / ratio);
      setCalculatedCoffeeWeight(calculatedCoffee);
      setValue("coffeeWeight", calculatedCoffee);
    }
  }, [coffeeWeight, waterWeight, ratio, inputMode, setValue]);

  const totalWater = inputMode === "coffee" ? calculatedWaterWeight : waterWeight;
  const totalCoffee = inputMode === "coffee" ? coffeeWeight : calculatedCoffeeWeight;

  const bloomWater = Math.round(totalCoffee * bloomMultiplier);
  const remainingWater = totalWater - bloomWater;
  const waterPerPour = Math.round(remainingWater / pours);

  const advancedTotalWater = advancedSteps.reduce(
    (sum, step) => sum + step.waterAmount,
    0
  );

  const waterDifference = totalWater - advancedTotalWater;

  function onSubmit(values: FormValues) {
    const totalBrewTimeSeconds = parseTimeToSeconds(values.totalBrewTime);

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
            : `Pour ${step.waterAmount}g of water in a circular motion`,
          description: step.description || undefined,
        };
      });

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

    const updatedRecipe: Recipe = createCustomRecipe({
      coffeeWeight: totalCoffee || 20,
      waterWeight: totalWater || 320,
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

    updatedRecipe.id = id;
    updatedRecipe.name = values.name;

    const existingRecipes = JSON.parse(
      localStorage.getItem("customRecipes") || "[]"
    );
    const updatedRecipes = existingRecipes.map((r: Recipe) =>
      r.id === id ? updatedRecipe : r
    );
    localStorage.setItem("customRecipes", JSON.stringify(updatedRecipes));

    router.push("/pour-over/custom/manage");
  }

  if (!recipe) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">Loading recipe...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Edit Recipe</h1>

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
                totalWater={totalWater || 0}
                advancedTotalWater={advancedTotalWater}
                waterDifference={waterDifference}
              />

              <RecipeSummary
                mode={mode}
                totalCoffee={totalCoffee || 0}
                totalWater={totalWater || 0}
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

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/pour-over/custom/manage")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 