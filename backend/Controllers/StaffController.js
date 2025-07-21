const Staff = require('../Models/staff');
const Shift = require('../Models/shift');

exports.addStaff = async (req, res) => {
  try {
    const { name, email, phone, role, position, department, status, salary, hireDate } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !department || !position) {
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

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const staff = new Staff({
      name,
      email,
      phone,
      role: role || 'waiter', // Default role if not provided
      position,
      department,
      status: status || 'Active',
      salary: salary || 0,
      hireDate: hireDate || null
    });

    await staff.save();
    res.status(201).json(staff);
  } catch (error) {
    console.error('Error adding staff:', error);
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