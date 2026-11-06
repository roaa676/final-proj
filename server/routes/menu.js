const express = require('express');
const MenuItem = require('../models/MenuItem');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for menu item images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Get all menu items (public)
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = { isAvailable: true };

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get menu item by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add new menu item (admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, ingredients, allergens, nutritionalInfo } = req.body;

        const menuItem = new MenuItem({
            name,
            description,
            price: parseFloat(price),
            category,
            ingredients: ingredients ? JSON.parse(ingredients) : [],
            allergens: allergens ? JSON.parse(allergens) : [],
            nutritionalInfo: nutritionalInfo ? JSON.parse(nutritionalInfo) : {},
            image: req.file ? `/uploads/${req.file.filename}` : ''
        });

        await menuItem.save();
        res.status(201).json({
            message: 'Menu item added successfully',
            menuItem
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update menu item (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, ingredients, allergens, nutritionalInfo, isAvailable } = req.body;

        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        menuItem.name = name || menuItem.name;
        menuItem.description = description || menuItem.description;
        menuItem.price = price ? parseFloat(price) : menuItem.price;
        menuItem.category = category || menuItem.category;
        menuItem.ingredients = ingredients ? JSON.parse(ingredients) : menuItem.ingredients;
        menuItem.allergens = allergens ? JSON.parse(allergens) : menuItem.allergens;
        menuItem.nutritionalInfo = nutritionalInfo ? JSON.parse(nutritionalInfo) : menuItem.nutritionalInfo;
        menuItem.isAvailable = isAvailable !== undefined ? isAvailable : menuItem.isAvailable;

        if (req.file) {
            menuItem.image = `/uploads/${req.file.filename}`;
        }

        await menuItem.save();
        res.json({
            message: 'Menu item updated successfully',
            menuItem
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete menu item (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get menu categories
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await MenuItem.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 