
import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:5000/api/expenses';

const initialForm = {
  title: '',
  amount: '',
  category: 'Food',
  date: new Date().toLocaleDateString('en-CA')
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const total = expenses.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  async function loadExpenses() {
    try {
      const response = await axios.get(API);
      setExpenses(response.data);
      setError('');
    } catch {
      setError('Could not load expenses. Check your backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    if (
      !form.title.trim() ||
      !form.date ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError('Enter a title, valid positive amount and date.');
      return;
    }

    const data = {
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date
    };

    try {
      let response;

      if (editingId) {
        response = await axios.put(`${API}/${editingId}`, data);
      } else {
        response = await axios.post(API, data);
      }

      setMessage(response.data.message);
      setForm(initialForm);
      setEditingId(null);
      await loadExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save expense.');
    }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      amount: String(item.amount),
      category: item.category,
      date: new Date(item.date).toISOString().slice(0, 10)
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setMessage('');
    setError('');

    try {
      const response = await axios.delete(`${API}/${id}`);
      setMessage(response.data.message);

      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }

      await loadExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete expense.');
    }
  }

  function formatMoney(amount) {
    return Number(amount).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    });
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }

  return (
    <main className="app">
      <header className="navbar">
        <div className="brand-icon">₹</div>
        <div className="brand-text">
          <h1>SpendWise</h1>
          <p>Personal Expense Tracker</p>
        </div>
        <span className="nav-label">Expense Manager</span>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">YOUR MONEY, YOUR CONTROL</p>
          <h2>Track every rupee.</h2>
          <p className="subtitle">
            Manage your daily spending with confidence.
          </p>
        </div>

        <div className="total-card">
          <p>Total Amount Spent</p>
          <h2>{formatMoney(total)}</h2>
          <span>{expenses.length} recorded expenses</span>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
            <p>Fill in the details below.</p>
          </div>
          <span className="plus-icon">＋</span>
        </div>

        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field full">
              Expense Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Grocery shopping"
                maxLength="100"
                required
              />
            </label>

            <label className="field">
              Amount (₹)
              <input
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </label>

            <label className="field">
              Category
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option>Food</option>
                <option>Travel</option>
                <option>Bills</option>
                <option>Shopping</option>
                <option>Other</option>
              </select>
            </label>

            <label className="field full">
              Date
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-btn" type="submit">
              {editingId ? 'Save Changes' : '+ Add Expense'}
            </button>

            {editingId && (
              <button
                className="secondary-btn"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                  setMessage('');
                  setError('');
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Recent Expenses</h2>
            <p>Your saved transactions.</p>
          </div>
          <span className="count">{expenses.length} total</span>
        </div>

        {loading ? (
          <p className="empty">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">₹</div>
            <h3>No expenses yet</h3>
            <p>Add your first expense using the form above.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(item => (
                  <tr key={item._id}>
                    <td className="expense-title">{item.title}</td>
                    <td>
                      <span className={`category ${item.category.toLowerCase()}`}>
                        {item.category}
                      </span>
                    </td>
                    <td>{formatDate(item.date)}</td>
                    <td className="amount">{formatMoney(item.amount)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="edit-btn"
                          type="button"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          type="button"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>SpendWise · Manage your money with confidence.</footer>
    </main>
  );
}

export default App;
