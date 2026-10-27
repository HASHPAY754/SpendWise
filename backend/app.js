
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Expense = require('./models/Expense');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas connected');
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });

// Validate expense input
function validateExpense(req, res, next) {
  const { title, amount, category, date } = req.body;

  const validCategories = [
    'Food',
    'Travel',
    'Bills',
    'Shopping',
    'Other'
  ];

  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.trim().length > 100 ||
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !validCategories.includes(category) ||
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  ) {
    return res.status(400).json({
      message: 'Please enter a valid title, positive amount, category and date.'
    });
  }

  next();
}

// CREATE: Add an expense
app.post('/api/expenses', validateExpense, async (req, res) => {
  try {
    const expense = await Expense.create({
      title: req.body.title.trim(),
      amount: req.body.amount,
      category: req.body.category,
      date: new Date(req.body.date + 'T00:00:00.000Z')
    });

    res.status(201).json({
      message: 'Expense added successfully',
      expense
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to add expense'
    });
  }
});

// READ: Get all expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({
      date: -1,
      _id: -1
    });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch expenses'
    });
  }
});

// UPDATE: Edit an expense
app.put('/api/expenses/:id', validateExpense, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense ID'
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title.trim(),
        amount: req.body.amount,
        category: req.body.category,
        date: new Date(req.body.date + 'T00:00:00.000Z')
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json({
      message: 'Expense updated successfully',
      expense
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to update expense'
    });
  }
});

// DELETE: Remove an expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid expense ID'
      });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: 'Expense not found'
      });
    }

    res.json({
      message: 'Expense deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to delete expense'
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
