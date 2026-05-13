const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://djchoudhary410_db_user:jZoOs05XDAGmYhdi@cluster0.orp0eu7.mongodb.net/?appName=Cluster0';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- MongoDB Models ---
const bookSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, default: 'Uncategorized' },
    tags: { type: [String], default: [] },
    coverUrl: { type: String, default: '' },
    status: { type: String, default: 'Available' },
    checkoutCount: { type: Number, default: 0 },
    waitlist: { type: [String], default: [] }
});

const memberSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    joinDate: { type: Date, default: Date.now }
});

const loanSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    bookId: { type: String, required: true },
    memberId: { type: String, required: true },
    checkoutDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null }
});

const Book = mongoose.model('Book', bookSchema);
const Member = mongoose.model('Member', memberSchema);
const Loan = mongoose.model('Loan', loanSchema);

const getBookDetails = async (bookId) => Book.findOne({ id: bookId }).lean();
const getMemberDetails = async (memberId) => Member.findOne({ id: memberId }).lean();

const getCoverUrl = (coverUrl, title = 'No Cover') => {
    const normalized = typeof coverUrl === 'string'
        ? coverUrl.trim()
        : coverUrl != null
            ? String(coverUrl).trim()
            : '';
    if (normalized && normalized.toLowerCase() !== 'null' && normalized.toLowerCase() !== 'undefined') {
        return normalized;
    }
    return `https://placehold.co/150x225?text=${encodeURIComponent(title || 'No Cover')}`;
};

const fetchOpenLibraryCover = async (title, author) => {
    try {
        const query = `title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`;
        const response = await axios.get(`https://openlibrary.org/search.json?${query}&limit=1`);
        
        if (response.data.docs && response.data.docs.length > 0) {
            const doc = response.data.docs[0];
            if (doc.cover_id) {
                return `https://covers.openlibrary.org/b/id/${doc.cover_id}-M.jpg`;
            }
            if (doc.isbn && doc.isbn.length > 0) {
                return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
            }
        }
        return null;
    } catch (err) {
        console.error('[fetchOpenLibraryCover] Error:', err.message);
        return null;
    }
};

const normalizeBook = (book) => ({
    ...book,
    coverUrl: getCoverUrl(book.coverUrl, book.title)
});

// --- 1. Book Catalog API ---
app.get('/api/books', async (req, res) => {
    try {
        const { search, tag, category } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { title: new RegExp(search, 'i') },
                { author: new RegExp(search, 'i') }
            ];
        }

        if (tag) {
            query.tags = tag;
        }

        if (category) {
            query.category = category;
        }

        const books = await Book.find(query).lean();
        const result = books.map(book => ({
            ...normalizeBook(book),
            waitlistCount: (book.waitlist || []).length
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load books.' });
    }
});

app.post('/api/books', async (req, res) => {
    try {
        const { title, author, category, tags, coverUrl } = req.body;
        console.log('[POST /api/books] Received book creation request', { title, author, category, tags });
        
        if (!title || !author) {
            console.warn('[POST /api/books] Validation failed: missing title or author');
            return res.status(400).json({ error: 'Title and author required.' });
        }

        let finalCoverUrl = coverUrl;
        
        // Try to fetch cover from Open Library if not provided
        if (!coverUrl) {
            console.log('[POST /api/books] Attempting to fetch cover from Open Library...');
            finalCoverUrl = await fetchOpenLibraryCover(title, author);
            if (finalCoverUrl) {
                console.log('[POST /api/books] Found Open Library cover:', finalCoverUrl);
            }
        }
        
        // Use placeholder if no cover found
        if (!finalCoverUrl) {
            finalCoverUrl = `https://placehold.co/150x225?text=${encodeURIComponent(title)}`;
        }

        const newBook = new Book({
            id: uuidv4(),
            title,
            author,
            category: category || 'Uncategorized',
            tags: tags || [],
            coverUrl: finalCoverUrl,
            status: 'Available',
            checkoutCount: 0
        });

        console.log('[POST /api/books] Created book object:', { id: newBook.id, title: newBook.title, category: newBook.category });
        await newBook.save();
        console.log('[POST /api/books] Book successfully saved to MongoDB:', newBook);
        
        res.status(201).json(normalizeBook(newBook));
    } catch (error) {
        console.error('[POST /api/books] Error occurred:', error.message);
        res.status(500).json({ error: 'Failed to create book.' });
    }
});

// Search Open Library
app.get('/api/books/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
        }

        const response = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`);
        
        const results = response.data.docs.map(doc => ({
            title: doc.title,
            author: doc.author_name?.[0] || 'Unknown',
            isbn: doc.isbn?.[0] || '',
            cover_id: doc.cover_id,
            coverUrl: doc.cover_id 
                ? `https://covers.openlibrary.org/b/id/${doc.cover_id}-M.jpg`
                : `https://covers.openlibrary.org/b/isbn/${doc.isbn?.[0] || 'none'}-M.jpg`,
            year: doc.first_publish_year || 'Unknown',
            subjects: doc.subject?.slice(0, 3) || []
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search Open Library.' });
    }
});

// Import from Open Library
app.get('/api/books/import/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;
        const response = await axios.get('https://openlibrary.org/api/books?bibkeys=ISBN:' + isbn + '&format=json&jscmd=data');
        const bookData = response.data['ISBN:' + isbn];
        if (!bookData) return res.status(404).json({ error: 'Book not found on Open Library' });

        const newBook = new Book({
            id: uuidv4(),
            title: bookData.title,
            author: bookData.authors?.[0]?.name || 'Unknown',
            category: bookData.subjects?.[0]?.name || 'Imported',
            tags: bookData.subjects?.map(s => s.name).slice(0, 3) || [],
            coverUrl: bookData.cover?.medium || `https://placehold.co/150x225?text=${encodeURIComponent(bookData.title)}`,
            status: 'Available',
            checkoutCount: 0
        });

        await newBook.save();
        res.status(201).json(newBook);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch book details.' });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const isBorrowed = await Loan.exists({ bookId: id, returnDate: null });
        if (isBorrowed) return res.status(400).json({ error: 'Cannot delete a borrowed book.' });

        await Book.deleteOne({ id });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete book.' });
    }
});

app.put('/api/books/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, author, category, tags, coverUrl, status } = req.body;
        
        console.log('[PUT /api/books/:id] Received update request', { id, title, author, category });
        
        const book = await Book.findOne({ id });
        if (!book) {
            console.warn('[PUT /api/books/:id] Book not found for id:', id);
            return res.status(404).json({ error: 'Book not found.' });
        }

        console.log('[PUT /api/books/:id] Found book, applying updates...');
        
        if (title) book.title = title;
        if (author) book.author = author;
        if (category) book.category = category;
        if (tags) book.tags = tags;
        if (coverUrl) book.coverUrl = coverUrl;
        if (status) book.status = status;

        await book.save();
        console.log('[PUT /api/books/:id] Book successfully updated:', { id, title: book.title, category: book.category });
        
        res.json(book);
    } catch (error) {
        console.error('[PUT /api/books/:id] Error occurred:', error.message, error);
        res.status(500).json({ error: 'Failed to update book.' });
    }
});

// --- 2. Member Management API ---
app.get('/api/members', async (req, res) => {
    try {
        const members = await Member.find().lean();
        const loans = await Loan.find({ returnDate: null }).lean();
        const countByMember = loans.reduce((acc, loan) => {
            acc[loan.memberId] = (acc[loan.memberId] || 0) + 1;
            return acc;
        }, {});

        const result = members.map(member => ({
            ...member,
            activeLoansCount: countByMember[member.id] || 0
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load members.' });
    }
});

app.post('/api/members', async (req, res) => {
    try {
        const { name, email } = req.body;
        if (!name || !email) return res.status(400).json({ error: 'Name and email mandatory.' });

        const newMember = new Member({ id: uuidv4(), name, email, joinDate: new Date() });
        await newMember.save();
        res.status(201).json(newMember);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create member.' });
    }
});

app.get('/api/members/:id', async (req, res) => {
    try {
        const member = await Member.findOne({ id: req.params.id }).lean();
        if (!member) return res.status(404).json({ error: 'Member not found.' });

        const loans = await Loan.find({ memberId: member.id, returnDate: null }).lean();
        const bookIds = loans.map(l => l.bookId);
        const books = await Book.find({ id: { $in: bookIds } }).lean();
        const bookMap = books.reduce((acc, book) => { acc[book.id] = book; return acc; }, {});

        const detailedLoans = loans.map(l => ({ ...l, book: bookMap[l.bookId] ? normalizeBook(bookMap[l.bookId]) : null }));
        res.json({ ...member, loans: detailedLoans });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load member details.' });
    }
});

// --- 3. Lending & Waitlist API ---
app.get('/api/loans/active', async (req, res) => {
    try {
        const loans = await Loan.find({ returnDate: null }).lean();
        const bookIds = [...new Set(loans.map(l => l.bookId))];
        const memberIds = [...new Set(loans.map(l => l.memberId))];

        const books = await Book.find({ id: { $in: bookIds } }).lean();
        const members = await Member.find({ id: { $in: memberIds } }).lean();

        const bookMap = books.reduce((acc, book) => { acc[book.id] = book; return acc; }, {});
        const memberMap = members.reduce((acc, member) => { acc[member.id] = member; return acc; }, {});

        const result = loans.map(l => ({
            ...l,
            book: bookMap[l.bookId] ? normalizeBook(bookMap[l.bookId]) : null,
            member: memberMap[l.memberId] || null
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load active loans.' });
    }
});

app.post('/api/lend', async (req, res) => {
    try {
        const { bookId, memberId } = req.body;
        const book = await Book.findOne({ id: bookId });
        const member = await Member.findOne({ id: memberId });

        if (!book || !member) return res.status(400).json({ error: 'Invalid book or member ID' });

        if (book.status === 'Borrowed') {
            if (!book.waitlist.includes(memberId)) {
                book.waitlist.push(memberId);
                await book.save();
                return res.status(202).json({ message: 'Book is currently borrowed. Added to waitlist.' });
            }
            return res.status(400).json({ error: 'Member already in waitlist.' });
        }

        book.status = 'Borrowed';
        book.checkoutCount += 1;
        await book.save();

        const loan = new Loan({
            id: uuidv4(),
            bookId,
            memberId,
            checkoutDate: new Date(),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        });
        await loan.save();

        res.status(200).json({ message: 'Book lent successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to lend book.' });
    }
});

app.post('/api/return/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const loan = await Loan.findOne({ bookId, returnDate: null });
        if (!loan) return res.status(400).json({ error: 'Book is not currently borrowed' });

        loan.returnDate = new Date();
        await loan.save();

        const book = await Book.findOne({ id: bookId });
        if (!book) return res.status(500).json({ error: 'Book record not found.' });

        if (book.waitlist.length > 0) {
            const nextMemberId = book.waitlist.shift();
            book.checkoutCount += 1;
            await book.save();

            const nextLoan = new Loan({
                id: uuidv4(),
                bookId,
                memberId: nextMemberId,
                checkoutDate: new Date(),
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            });
            await nextLoan.save();

            const nextMember = await Member.findOne({ id: nextMemberId }).lean();
            res.status(200).json({ message: 'Book returned and auto-assigned to ' + (nextMember?.name || 'next member') + ' (from waitlist)' });
        } else {
            book.status = 'Available';
            await book.save();
            res.status(200).json({ message: 'Book returned successfully.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to return book.' });
    }
});

app.get('/api/waitlist/:bookId', async (req, res) => {
    try {
        const book = await Book.findOne({ id: req.params.bookId }).lean();
        if (!book) return res.status(404).json({ error: 'Book not found.' });

        const waitlistMembers = await Member.find({ id: { $in: book.waitlist } }).lean();
        const memberMap = waitlistMembers.reduce((acc, member) => { acc[member.id] = member; return acc; }, {});
        const detailed = book.waitlist.map(memberId => memberMap[memberId] || null).filter(Boolean);
        res.json(detailed);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load waitlist.' });
    }
});

// --- 4. Reports & Analytics API ---
app.get('/api/reports/overdue', async (req, res) => {
    try {
        const now = new Date();
        const overdueLoans = await Loan.find({ returnDate: null, dueDate: { $lt: now } }).lean();
        const bookIds = [...new Set(overdueLoans.map(l => l.bookId))];
        const memberIds = [...new Set(overdueLoans.map(l => l.memberId))];
        const books = await Book.find({ id: { $in: bookIds } }).lean();
        const members = await Member.find({ id: { $in: memberIds } }).lean();

        const bookMap = books.reduce((acc, book) => { acc[book.id] = book; return acc; }, {});
        const memberMap = members.reduce((acc, member) => { acc[member.id] = member; return acc; }, {});

        const result = overdueLoans.map(l => ({
            ...l,
            book: bookMap[l.bookId] ? normalizeBook(bookMap[l.bookId]) : null,
            member: memberMap[l.memberId] || null
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load overdue report.' });
    }
});

app.get('/api/reports/top-books', async (req, res) => {
    try {
        const books = await Book.find().sort({ checkoutCount: -1 }).limit(5).lean();
        res.json(books.map(normalizeBook));
    } catch (error) {
        res.status(500).json({ error: 'Failed to load top books.' });
    }
});

app.get('/api/reports/member-stats', async (req, res) => {
    try {
        const members = await Member.find().lean();
        const stats = await Promise.all(members.map(async member => {
            const totalLoans = await Loan.countDocuments({ memberId: member.id });
            const currentLoans = await Loan.countDocuments({ memberId: member.id, returnDate: null });
            return {
                name: member.name,
                totalLoans,
                currentLoans
            };
        }));
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load member stats.' });
    }
});

const seed = async () => {
    const existingBooks = await Book.countDocuments();
    const existingMembers = await Member.countDocuments();

    if (existingBooks > 0 || existingMembers > 0) return;

    const b1 = uuidv4();
    const b2 = uuidv4();
    const m1 = uuidv4();
    const m2 = uuidv4();

    await Book.create([
        {
            id: b1,
            title: 'The Hobbit',
            author: 'J.R.R. Tolkien',
            tags: ['Fantasy', 'Adventure'],
            status: 'Available',
            checkoutCount: 5,
            coverUrl: 'https://covers.openlibrary.org/b/isbn/9780547928227-M.jpg'
        },
        {
            id: b2,
            title: 'Deep Work',
            author: 'Cal Newport',
            tags: ['Productivity', 'Focus'],
            status: 'Available',
            checkoutCount: 2,
            coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455586691-M.jpg'
        }
    ]);

    await Member.create([
        { id: m1, name: 'Subho', email: 'subho@example.com', joinDate: new Date() },
        { id: m2, name: 'Sritama', email: 'sritama@example.com', joinDate: new Date() }
    ]);
};

mongoose.connect(MONGODB_URI, {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
})
    .then(async () => {
        console.log('[MongoDB] Connected successfully');
        await seed();
        app.listen(PORT, () => {
            console.log('Librarian AI is awake at http://localhost:' + PORT);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });