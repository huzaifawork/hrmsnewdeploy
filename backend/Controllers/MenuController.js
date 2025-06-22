const Menu = require('../Models/Menu');

// Get all menu items
exports.getMenus = async (req, res) => {
    try {
        const menus = await Menu.find();
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get menu items by category
exports.getMenusByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const menus = await Menu.find({ category });
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a new menu item
exports.addMenu = async (req, res) => {
    try {
        const { name, description, price, category, availability } = req.body;
        // Handle image upload - generate filename for memory storage in production
        let image = null;
        if (req.file) {
          if (req.file.filename) {
            // Disk storage (development)
            image = `/uploads/${req.file.filename}`;
          } else {
            // Memory storage (production) - generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const extension = req.file.originalname.split('.').pop();
            const filename = `${uniqueSuffix}.${extension}`;
            image = `/uploads/${filename}`;

            console.log('Production menu upload detected, filename generated:', filename);
          }
        }
        
        const newMenu = new Menu({ 
            name, 
            description, 
            price, 
            category, 
            availability,
            image 
        });
        
        const savedMenu = await newMenu.save();
        res.status(201).json(savedMenu);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update a menu item
exports.updateMenu = async (req, res) => {
    try {
        const { name, description, price, category, availability } = req.body;
        const updateData = { name, description, price, category, availability };
        
        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        const updatedMenu = await Menu.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedMenu) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        res.status(200).json(updatedMenu);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a menu item
exports.deleteMenu = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        await Menu.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Toggle menu item availability
exports.toggleAvailability = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ error: 'Menu item not found' });
        }
        menu.availability = !menu.availability;
        const updatedMenu = await menu.save();
        res.status(200).json(updatedMenu);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
