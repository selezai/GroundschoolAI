import express, { Request } from 'express';
import { auth } from '../middleware/auth';
import User from '../models/User';

interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

const router = express.Router();

// Get user profile
router.get('/', auth, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/', auth, async (req: AuthRequest, res) => {
  try {
    const { name, email } = req.body;
    const updates: { name?: string; email?: string } = {};
    
    if (name) updates.name = name;
    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: req.user?.userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updates.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user?.userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

export default router;
