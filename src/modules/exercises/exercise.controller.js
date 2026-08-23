import { get } from "node:https";
import { getExcercise, createExercise } from "./exercise.service.js";


export async function getAllExercise(req, res) {
    try {
        const userId = req.user.userId;
        const { category, name } = req.query;

        const exercises = await getExcercise({ userId, category, name });
        return res.json({
            message: "Exercises fetched successfully",
            data: exercises,
        });
    } catch (error) {
        next(error);
    }
};

export async function addExercise(req, res, next) {
    try {
        const userId = req.user.userId;
        const { name, category, favorite } = req.body;

        const exercise = await createExercise({ userId, name, category, favorite });
        return res.status(201).json({
            message: "Exercise created successfully",
            data: exercise,
        });
    } catch (error) {
        next(error);
    }
}

export default {
    getAllExercise,
    addExercise,
};