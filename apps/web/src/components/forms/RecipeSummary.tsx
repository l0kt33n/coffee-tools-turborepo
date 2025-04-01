import React from "react";
import { FormValues } from "@/lib/recipe-form-schema";

interface RecipeSummaryProps {
  mode: string;
  totalCoffee: number;
  totalWater: number;
  ratio: number;
  waterTemperature: number | undefined;
  temperatureUnit: string;
  advancedSteps: FormValues["advancedSteps"];
  bloomWater: number;
  waterPerPour: number;
  pours: number;
  formatTime: (seconds: number) => string;
  watchIncludeDrawdown: () => boolean;
}

export const RecipeSummary: React.FC<RecipeSummaryProps> = ({
  mode,
  totalCoffee,
  totalWater,
  ratio,
  waterTemperature,
  temperatureUnit,
  advancedSteps,
  bloomWater,
  waterPerPour,
  pours,
  formatTime,
  watchIncludeDrawdown,
}) => {
  return (
    <div className="p-4 mt-6 border rounded-md bg-gray-50 dark:bg-gray-900">
      <h3 className="text-lg font-bold mb-4">Recipe Summary</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-500">Coffee</div>
          <div className="font-medium">{totalCoffee}g</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Water</div>
          <div className="font-medium">{totalWater}g</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Ratio</div>
          <div className="font-medium">1:{ratio}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Temperature</div>
          <div className="font-medium">
            {waterTemperature}°{temperatureUnit}
          </div>
        </div>
      </div>

      <h4 className="font-medium mt-4 mb-2">Steps</h4>
      <div className="space-y-2">
        {mode === "advanced" ? (
          // Advanced mode steps
          <>
            {advancedSteps?.map((step, index) => {
              // Calculate cumulative water
              const prevSteps = advancedSteps.slice(0, index);
              const cumulativeWater =
                prevSteps.reduce((sum, s) => sum + (s?.waterAmount || 0), 0) +
                step.waterAmount;

              return (
                <div key={index} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {step.isBloom ? "Bloom" : `Pour ${index}`}
                    </span>
                    <span className="ml-2">{step.waterAmount}g</span>
                    {step.isBloom ? null : (
                      <span className="text-gray-500 ml-2">
                        (total: {cumulativeWater}g)
                      </span>
                    )}
                  </div>
                  <div>
                    {formatTime(
                      advancedSteps
                        .slice(0, index)
                        .reduce((sum, s) => sum + (s?.duration || 0), 0),
                    )}
                  </div>
                </div>
              );
            })}

            {watchIncludeDrawdown() && (
              <div className="flex justify-between text-sm">
                <div className="font-medium">Drawdown</div>
                <div>
                  {formatTime(
                    advancedSteps?.reduce(
                      (sum, s) => sum + (s?.duration || 0),
                      0,
                    ) || 0,
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          // Basic mode steps
          <>
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-medium">Bloom</span>
                <span className="ml-2">{bloomWater}g</span>
              </div>
              <div>0:00</div>
            </div>

            {Array.from({ length: pours }).map((_, i) => {
              const pourProgress = bloomWater + waterPerPour * (i + 1);
              const pourStartTime = 45 + i * 30; // Simplified timing

              return (
                <div key={i} className="flex justify-between text-sm">
                  <div>
                    <span className="font-medium">Pour {i + 1}</span>
                    <span className="ml-2">{waterPerPour}g</span>
                    <span className="text-gray-500 ml-2">
                      (total: {pourProgress}g)
                    </span>
                  </div>
                  <div>{formatTime(pourStartTime)}</div>
                </div>
              );
            })}

            <div className="flex justify-between text-sm">
              <div className="font-medium">Drawdown</div>
              <div>{formatTime(45 + pours * 30)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
