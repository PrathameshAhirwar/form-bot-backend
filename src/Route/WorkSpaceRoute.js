const express = require('express');
const router = express.Router();
const User = require('../models/user');
const WorkspaceAccess = require('../models/WorkSpace'); // Changed to match model name
const userAuth = require('../middlewares/userAuth');
const Folder = require('../models/folder')
const {Form} = require('../models/form')

router.post('/workspace/:userId/share', userAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, accessType } = req.body;

        const userToShare = await User.findOne({ email });
        if (!userToShare) {
            return res.status(404).json({ message: 'No user found with this email address' });
        }

        if (userToShare._id.toString() === userId) {
            return res.status(400).json({ message: 'Cannot share workspace with yourself' });
        }

        let workspaceAccess = await WorkspaceAccess.findOne({ workspace: userId });
        
        if (!workspaceAccess) {
            workspaceAccess = new WorkspaceAccess({
                workspace: userId,
                accessibleBy: [],
                shareLinks: []
            });
        }

        const existingAccess = workspaceAccess.accessibleBy.find(
            access => access.userId.toString() === userToShare._id.toString()
        );

        if (existingAccess) {
            return res.status(400).json({ message: 'Workspace already shared with this user' });
        }

        workspaceAccess.accessibleBy.push({
            userId: userToShare._id,
            accessType
        });

        await workspaceAccess.save();

        res.status(200).json({ 
            message: 'Workspace access granted successfully',
            userName: userToShare.name 
        });
    } catch (error) {
        console.error('Share workspace error:', error);
        res.status(500).json({ message: 'Failed to share workspace' });
    }
});

router.get('/workspace/shared', userAuth, async (req, res) => {
    try {
        const userId = req.user._id;

        const sharedWorkspaces = await WorkspaceAccess.find({
            'accessibleBy.userId': userId
        })
        .populate('workspace', 'name')
        .lean();

        // Ensure safe access to avoid errors when 'accessibleBy' is empty or the user is not found
        const formattedWorkspaces = sharedWorkspaces.map(ws => {
            // Find the user's access entry, if it exists
            const userAccess = ws.accessibleBy.find(a => a.userId.toString() === userId.toString());

            if (userAccess) {
                return {
                    ownerId: ws.workspace._id,
                    ownerName: ws.workspace.name,
                    accessType: userAccess.accessType,
                    workspaceId: ws._id
                };
            } else {
                // If the user doesn't have access, return an empty or default object
                return {
                    ownerId: ws.workspace._id,
                    ownerName: ws.workspace.name,
                    accessType: 'No Access',  // Or any default value you prefer
                    workspaceId: ws._id
                };
            }
        });

        res.status(200).json(formattedWorkspaces);
    } catch (error) {
        console.error('Get shared workspaces error:', error);
        res.status(500).json({ message: 'Failed to fetch shared workspaces' });
    }
});


// In your workspace routes file
// In your workspace routes file
router.get('/workspace/:workspaceId/data', userAuth, async (req, res) => {
    try {
        const { workspaceId } = req.params;
        console.log('Fetching data for workspace:', workspaceId);
        
        // Check if user has access to this workspace
        const workspaceAccess = await WorkspaceAccess.findOne({
            workspace: workspaceId,
            'accessibleBy.userId': req.user._id
        });

        const isOwner = workspaceId === req.user._id.toString();
        console.log('Access check:', { isOwner, hasAccess: !!workspaceAccess });
        
        if (!isOwner && !workspaceAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Fetch the workspace owner's folders and forms
        const workspaceOwner = await User.findById(workspaceId);
        if (!workspaceOwner) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Fetch folders and forms for the workspace
        const folders = await Folder.find({ userId: workspaceId });
        const forms = await Form.find({ 
            userId: workspaceId,
            $or: [
                { folderId: { $exists: false } },
                { folderId: null }
            ]
        });

        console.log('Found data:', {
            folderCount: folders.length,
            formCount: forms.length
        });

        res.status(200).json({
            folders,
            forms,
            userName: workspaceOwner.name
        });

    } catch (error) {
        console.error('Fetch workspace data error:', error);
        res.status(500).json({ message: 'Failed to fetch workspace data' });
    }
});



module.exports = router;