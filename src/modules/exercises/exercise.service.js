import { prisma } from '../../config/db.js';

export async function getExcercise( { userId, category, name }) {
    const where = {

        OR: [
            { userId: null },
            { userId: userId},
        ],
    };

    if (category) {
        where.category = {
            equals: category, 
            mode: 'intensitive',
        };
    }

    if (name) {
        where.name = {
            contains: name, 
            mode: 'intensitive',
        };
    }
    
    return await prisma.exercise.findMany({
        where,
        orderBy: {
            name: 'asc',
        },
    });
}


export async function createExercise ( { userId, name, category, favorite = false }) {
    return await prisma.exercise.create({
        data: {
            userId,
            name,
            category,
            favorite,
        },
    });
}

export default {
    getExcercise,
    createExercise,
}

