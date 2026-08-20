import { z } from 'zod';

export const getExerciseQuerySchema = z.object({
    category: z.string().trim().optional(),
    name: z.string().trim().optional(),
});

export const createExerciseSchema = z.object({
    name: z.string({ required_error: "Exercise name is required" }).trim().min(1, "Exercise name cannot be empty"),
    category: z.string({ required_error: "Exercise category is required" }).trim().min(1, "Exercise category cannot be empty"),
    favorite: z.boolean().optional().default(false),
});

export default {
    getExerciseQuerySchema,
    createExerciseSchema,
};

