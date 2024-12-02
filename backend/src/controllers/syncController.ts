import { Request, Response } from 'express';
import { User } from '../models/User';
import { SyncLog } from '../models/SyncLog';

export const syncController = {
  // Initiate a sync operation
  startSync: async (req: Request, res: Response) => {
    try {
      const { userId, type } = req.body;

      const syncLog = await SyncLog.create({
        userId,
        type,
        status: 'pending',
        startedAt: new Date(),
      });

      // Update user's last sync timestamp
      await User.findByIdAndUpdate(userId, {
        lastSyncedAt: new Date(),
      });

      res.status(200).json({ 
        success: true, 
        syncId: syncLog._id,
        message: 'Sync operation started' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to start sync operation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update sync status and data
  updateSync: async (req: Request, res: Response) => {
    try {
      const { syncId } = req.params;
      const { status, syncedData, error } = req.body;

      const syncLog = await SyncLog.findById(syncId);
      if (!syncLog) {
        return res.status(404).json({
          success: false,
          message: 'Sync log not found'
        });
      }

      syncLog.status = status;
      syncLog.syncedData = syncedData;
      if (error) syncLog.error = error;
      if (status === 'completed') syncLog.completedAt = new Date();

      await syncLog.save();

      res.status(200).json({
        success: true,
        message: 'Sync status updated',
        syncLog
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update sync status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Get sync history for a user
  getSyncHistory: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const syncLogs = await SyncLog.find({ userId })
        .sort({ startedAt: -1 })
        .limit(10);

      res.status(200).json({
        success: true,
        syncLogs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sync history',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};
