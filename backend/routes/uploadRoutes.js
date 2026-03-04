import express from 'express';
import { uploadCustomDesign } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/custom-design', uploadCustomDesign);

export default router;

