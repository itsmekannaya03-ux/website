import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(process.cwd(), 'src/data/c-questions.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Optional: clear existing questions if needed, but let's just append or keep it simple.
  // await prisma.question.deleteMany();

  for (let i = 0; i < data.length; i++) {
    const q = data[i];
    
    // determine correctOption (A, B, C, or D)
    let correctOption = 'A';
    if (q.options[1] === q.answer) correctOption = 'B';
    if (q.options[2] === q.answer) correctOption = 'C';
    if (q.options[3] === q.answer) correctOption = 'D';

    await prisma.question.create({
      data: {
        text: q.question,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctOption,
        order: i,
      }
    });
  }
  console.log('Seeded ' + data.length + ' questions.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
