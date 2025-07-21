const Staff = require('../Models/staff');
const Shift = require('../Models/shift');
const mongoose = require('mongoose');

exports.addStaff = async (req, res) => {
  try {
    console.log('🔄 Staff creation request received');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User info:', req.user ? { id: req.user.id, role: req.user.role } : 'No user info');

    const { name, email, phone, role, position, department, status, salary, hireDate } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !department || !position) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({
        message: 'Name, email, phone, department, and position are required',
        missingFields: {
          name: !name,
          email: !email,
          phone: !phone,
          department: !department,
          position: !position
        }
      });
    }

    console.log('✅ Basic validation passed');

    // Check if email already exists
    console.log('🔍 Checking if email exists:', email);
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      console.log('❌ Email already exists');
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.log('✅ Email is unique');

    const staffData = {
      name,
      email,
      phone,
      role: role || 'waiter', // Default role if not provided
      position,
      department,
      status: status || 'Active',
      salary: salary || 0,
      hireDate: hireDate || null,
      // Add a unique userId to prevent constraint issues
      userId: new mongoose.Types.ObjectId()
    };

    console.log('📋 Creating staff with data:', JSON.stringify(staffData, null, 2));

    const staff = new Staff(staffData);

    console.log('💾 Saving staff to database...');
    await staff.save();

    console.log('✅ Staff created successfully:', staff._id);
    res.status(201).json(staff);
  } catch (error) {
    console.error('💥 Error adding staff:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    if (error.name === 'ValidationError') {
      console.log('❌ Mongoose validation error');
      return res.status(400).json({
        message: 'Validation error',
        details: error.message,
        errors: error.errors
      });
    }

    if (error.code === 11000) {
      console.log('❌ Duplicate key error');
      const field = Object.keys(error.keyPattern)[0];

      if (field === 'userId') {
        // Handle the userId index issue by providing a unique userId
        console.log('🔧 Handling userId duplicate key error - retrying with userId');
        try {
          const retryStaffData = {
            name,
            email,
            phone,
            role: role || 'waiter',
            position,
            department,
            status: status || 'Active',
            salary: salary || 0,
            hireDate: hireDate || null,
            userId: new mongoose.Types.ObjectId() // Generate a unique userId
          };
          const staff = new Staff(retryStaffData);
          await staff.save();
          console.log('✅ Staff created successfully with generated userId');
          return res.status(201).json(staff);
        } catch (retryError) {
          console.error('❌ Retry with userId also failed:', retryError);
          return res.status(500).json({
            message: 'Failed to create staff due to database constraint',
            details: retryError.message
          });
        }
      }

      return res.status(400).json({
        message: field === 'email' ? 'Email already exists' : `${field} already exists`,
        field: field
      });
    }

    res.status(500).json({
      message: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select('-__v');
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { name, email, phone, role, position, department, status, salary, hireDate } = req.body;
    const staffId = req.params.id;

    // Check if staff exists
    const existingStaff = await Staff.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // If email is being updated, check if it's already taken
    if (email && email !== existingStaff.email) {
      const emailExists = await Staff.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (position) updateData.position = position;
    if (department) updateData.department = department;
    if (status) updateData.status = status;
    if (salary !== undefined) updateData.salary = salary;
    if (hireDate) updateData.hireDate = hireDate;

    const updatedStaff = await Staff.findByIdAndUpdate(
      staffId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedStaff);
  } catch (error) {
    console.error('Error updating staff:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        details: error.message,
        errors: error.errors
      });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;

    // Check if staff exists
    const existingStaff = await Staff.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Delete all shifts associated with the staff member
    await Shift.deleteMany({ staffId });

    // Delete the staff member
    await Staff.findByIdAndDelete(staffId);
    
    res.status(200).json({ message: 'Staff and associated shifts deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};