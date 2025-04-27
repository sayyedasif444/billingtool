import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Dev & Debate API',
    status: 'Server is running'
  });
});

export default router; 