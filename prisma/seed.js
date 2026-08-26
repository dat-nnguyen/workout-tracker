import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { invalidateCache } from '../src/config/redis.js';

const prisma = new PrismaClient();

await invalidateCache('exercises:global:cat:all:name:all');

const defaultExercises = [
  // Chest
  { name: "Barbell Bench Press", category: "Chest" },
  { name: "Incline Dumbbell Press", category: "Chest" },
  { name: "Push-Up", category: "Chest" },
  { name: "Cable Chest Fly", category: "Chest" },
  { name: "Chest Dips", category: "Chest" },

  // Back
  { name: "Conventional Deadlift", category: "Back" },
  { name: "Barbell Bent-Over Row", category: "Back" },
  { name: "Pull-Up", category: "Back" },
  { name: "Lat Pulldown", category: "Back" },
  { name: "Seated Cable Row", category: "Back" },

  // Legs
  { name: "Barbell Back Squat", category: "Legs" },
  { name: "Romanian Deadlift", category: "Legs" },
  { name: "Leg Press", category: "Legs" },
  { name: "Bulgarian Split Squat", category: "Legs" },
  { name: "Standing Calf Raise", category: "Legs" },

  // Shoulders
  { name: "Overhead Press", category: "Shoulders" },
  { name: "Dumbbell Lateral Raise", category: "Shoulders" },
  { name: "Face Pull", category: "Shoulders" },
  { name: "Front Dumbbell Raise", category: "Shoulders" },
  { name: "Rear Delt Fly", category: "Shoulders" },

  // Arms
  { name: "Barbell Bicep Curl", category: "Arms" },
  { name: "Dumbbell Hammer Curl", category: "Arms" },
  { name: "Tricep Rope Pushdown", category: "Arms" },
  { name: "Skull Crusher", category: "Arms" },
  { name: "Incline Dumbbell Curl", category: "Arms" },

  // Core
  { name: "Plank", category: "Core" },
  { name: "Hanging Leg Raise", category: "Core" },
  { name: "Cable Woodchopper", category: "Core" },
  { name: "Ab Wheel Rollout", category: "Core" },
];

async function main() {
  console.log("🌱 Starting database seeding...");
  const hashedPassword = await bcrypt.hash("password", 10);
  // 1. Seed Demo Users
  const user1 = await prisma.user.upsert({
    where: { email: "dat@example.com" },
    update: { password: hashedPassword },
    create: {
      email: "dat@example.com",
      password: hashedPassword,
      name: "Dat Nguyen",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "trang@example.com" },
    update: { password: hashedPassword },
    create: {
      email: "trang@example.com",
      password: hashedPassword,
      name: "Trang Nguyen",
    },
  });

  console.log(`✅ Seeded users: ${user1.name}, ${user2.name}`);

  // 2. Fetch existing system exercises to avoid duplicates
  const existingExercises = await prisma.exercise.findMany({
    where: { userId: null },
    select: { name: true },
  });

  const existingNames = new Set(existingExercises.map((e) => e.name));
  const newExercises = defaultExercises
    .filter((e) => !existingNames.has(e.name))
    .map((e) => ({
      name: e.name,
      category: e.category,
      favorite: false,
      userId: null,
    }));

  if (newExercises.length > 0) {
    const result = await prisma.exercise.createMany({
      data: newExercises,
    });
    console.log(`Seeded ${result.count} new exercises.`);
  } else {
    console.log("All standard exercises already exist in database.");
  }

  console.log(`Total standard exercise catalog: ${defaultExercises.length} exercises.`);
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
