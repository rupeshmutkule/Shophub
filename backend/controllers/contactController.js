import Contact from '../models/Contact.js';

export const createContact = async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();
    res.json({ message: 'Message received' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllContacts = async (req, res) => {
  try {
    // Only admins can view all contacts
    if (!req.session.user || req.session.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
