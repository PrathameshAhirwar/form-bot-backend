// routes/dashboard.js
const express = require('express');
const router = express.Router();
const {Form} = require('../models/form');
const Folder = require('../models/folder')
const userAuth = require('../middlewares/userAuth');
const User = require('../models/user')

// Get dashboard data
router.get('/dashboard/:userId', userAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verify user authorization
        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        // Get folders and forms
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const folders = await Folder.find({ 
            userId, 
            isDeleted: false 
        }).populate('forms');
        
        const rootForms = await Form.find({ 
            userId, 
            folderId: null,
            isDeleted: false 
        });

        res.json({
            userName : user.userName,
            folders,
            rootForms
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Create folder
router.post('/:userId/createFolder', userAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name } = req.body;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        // Check for if folder with same name is present
        const existingFolder = await Folder.findOne({
            userId,
            name
            });
        if(!existingFolder){
            const folder = new Folder({
                name,
                userId
            });
    
            await folder.save();
            
            // Update user's folders array
            await req.user.updateOne({ $push: { folder: folder._id } });
    
            res.status(201).json(folder);    
        }
        else{
            res.json({
                message:"Folder Already exist"
            })
        }

        
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Create form in root
router.post('/:userId/createForm', userAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, schema } = req.body;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        // Check for existing form
        const existingForm = await Form.findOne({
            userId,
            name
        });
        if(!existingForm){
            const form = new Form({
                name,
                userId,
                schema
            });

            await form.save();
            
            // Update user's forms array
            await req.user.updateOne({ $push: { forms: form._id } });

            res.status(201).json(form);
        }else{
            res.json({
                message:"Form Already exist"
            })
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Create form in folder
router.post('/:userId/folder/:folderId/createForm', userAuth, async (req, res) => {
    try {
        const { userId, folderId } = req.params;
        const { name, schema } = req.body;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) {
            return res.status(404).send('Folder not found');
        }

        const existingForm = await Form.findOne({
            userId,
            name
        })
        if(!existingForm){
            const form = new Form({
                name,
                userId,
                folderId,
                schema
            });

            await form.save();
            
            // Update folder's forms array
            await folder.updateOne({ $push: { forms: form._id } });
            
            // Update user's forms array
            await req.user.updateOne({ $push: { forms: form._id } });

            res.status(201).json(form);
        }
        else{
            res.json({
                message:"Form Already exist"
            })
        }
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Delete folder
router.delete('/:userId/folder/:folderId', userAuth, async (req, res) => {
    try {
        const { userId, folderId } = req.params;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) {
            return res.status(404).send('Folder not found');
        }

        // Soft delete folder and all forms inside it
        await folder.updateOne({ isDeleted: true });
        await Form.updateMany({ folderId }, { isDeleted: true });

        res.send('Folder deleted successfully');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Get forms inside a folder
router.get('/:userId/folder/:folderId/forms', userAuth, async (req, res) => {
    try {
        const { userId, folderId } = req.params;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const folder = await Folder.findOne({ _id: folderId, userId }).populate('forms');
        if (!folder) {
            return res.status(404).send('Folder not found');
        }

        res.json(folder.forms);
    } catch (err) {
        res.status(400).send(err.message);
    }
});


// Delete form
router.delete('/:userId/form/:formId', userAuth, async (req, res) => {
    try {
        const { userId, formId } = req.params;

        if (req.user._id.toString() !== userId) {
            return res.status(403).send('Unauthorized access');
        }

        const form = await Form.findOne({ _id: formId, userId });
        if (!form) {
            return res.status(404).send('Form not found');
        }

        // Soft delete form
        await form.updateOne({ isDeleted: true });

        res.send('Form deleted successfully');
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;