const fs = require('fs');
const txt = fs.readFileSync('components/ContinuousTraining.tsx', 'utf8');
const lines = txt.split('\n');
const fixedLines = lines.slice(0, 8); // keeps 0 to 7
fixedLines.push(
`  deleteTrainingCourse,
  getAssignmentsForUser,
  getFinalTestQuestions,
  getLearningProgress,
  getLessonsByCourse,
  getMaterialsByCourse,
  getQuestionsByLesson,
  getTrainingCourses,
  markLessonComplete,
  publishTrainingCourse,
  submitFinalTest,
  updateTrainingCourse,
  uploadTrainingMaterial,
  getLearnerCourseStats
} from '../services/trainingService';

type AnyRow = Record<string, any>;
type ViewMode = 'LEARNER' | 'ADMIN';
`
);
const remainingLines = lines.slice(8); // from 'const parseOptions = ...'
fs.writeFileSync('components/ContinuousTraining.tsx', fixedLines.join('\n') + remainingLines.join('\n'));
