import * as z from "zod";

export const recipeFormSchema = z.object({
  name: z.string().min(3, {
    message: "Recipe name must be at least 3 characters.",
  }),
  coffeeWeight: z.coerce
    .number()
    .min(10, { message: "Coffee weight must be at least 10g." })
    .max(100, { message: "Coffee weight must be less than 100g." })
    .optional(),
  waterWeight: z.coerce
    .number()
    .min(150, { message: "Water weight must be at least 150g." })
    .max(2000, { message: "Water weight must be less than 2000g." })
    .optional(),
  ratio: z.coerce
    .number()
    .min(10, { message: "Ratio must be at least 10:1." })
    .max(20, { message: "Ratio must be less than 20:1." }),
  pours: z.coerce
    .number()
    .int()
    .min(1, { message: "At least 1 pour is required." })
    .max(10, { message: "Maximum 10 pours allowed." }),
  bloomMultiplier: z.coerce
    .number()
    .min(1, { message: "Bloom multiplier must be at least 1." })
    .max(5, { message: "Bloom multiplier must be less than 5." }),
  totalBrewTime: z.string().min(3, { message: "Total brew time is required." }),
  inputMode: z.enum(["coffee", "water"]),
  mode: z.enum(["basic", "advanced"]),
  advancedSteps: z
    .array(
      z.object({
        waterAmount: z.coerce
          .number()
          .min(1, { message: "Water amount is required" }),
        duration: z.coerce.number().min(1, { message: "Duration is required" }),
        isBloom: z.boolean().optional().default(false),
        description: z.string().optional(),
      }),
    )
    .optional(),
  waterTemperature: z.coerce
    .number()
    .min(0, { message: "Water temperature must be at least 0." })
    .max(100, {
      message: "Water temperature must be less than 100°C or 212°F.",
    }),
  temperatureUnit: z.enum(["C", "F"]),
  includeDrawdown: z.boolean().default(true),
});

export type FormValues = z.infer<typeof recipeFormSchema>;

// Helper function to convert between temperature units
export const convertTemperature = (
  temp: number,
  fromUnit: string,
  toUnit: string,
): number => {
  if (fromUnit === toUnit) return temp;
  if (fromUnit === "C" && toUnit === "F") {
    return Math.round((temp * 9) / 5 + 32);
  } else {
    return Math.round(((temp - 32) * 5) / 9);
  }
};
